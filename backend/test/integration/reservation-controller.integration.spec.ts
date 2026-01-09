import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Module } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ReservationController } from '../../src/presentation/controllers/reservation.controller';
import { EventController } from '../../src/presentation/controllers/event.controller';
import { CreateReservationUseCase } from '../../src/application/use-cases/create-reservation.use-case';
import { CreateEventUseCase } from '../../src/application/use-cases/create-event.use-case';
import { ProcessPaymentUseCase } from '../../src/application/use-cases/process-payment.use-case';
import { TypeOrmEventRepository } from '../../src/infrastructure/persistence/repositories/typeorm-event.repository';
import { TypeOrmReservationRepository } from '../../src/infrastructure/persistence/repositories/typeorm-reservation.repository';
import { TypeOrmTicketRepository } from '../../src/infrastructure/persistence/repositories/typeorm-ticket.repository';
import { EventOrmEntity } from '../../src/infrastructure/persistence/entities/event.orm-entity';
import { TicketConfigurationOrmEntity } from '../../src/infrastructure/persistence/entities/ticket-configuration.orm-entity';
import { ReservationOrmEntity } from '../../src/infrastructure/persistence/entities/reservation.orm-entity';
import { TicketOrmEntity } from '../../src/infrastructure/persistence/entities/ticket.orm-entity';
import { EventDetailsOrmEntity } from '../../src/infrastructure/persistence/entities/event-details.orm-entity';
import { TicketType } from '../../src/domain/value-objects/ticket-type.vo';
import { EVENT_REPOSITORY, RESERVATION_REPOSITORY, TICKET_REPOSITORY } from '../../src/domain/interfaces/repository-tokens';
import { IPaymentGateway, PaymentResult, PaymentData } from '../../src/domain/interfaces/payment-gateway.interface';

/**
 * Mock Payment Gateway for testing
 * Allows simulating successful and failed payments
 */
class MockPaymentGateway implements IPaymentGateway {
  private shouldFail = false;

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  async processPayment(data: PaymentData): Promise<PaymentResult> {
    if (this.shouldFail) {
      return {
        success: false,
        errorCode: 'PAYMENT_DECLINED',
        errorMessage: 'Payment was declined by the payment processor',
      };
    }

    return {
      success: true,
      transactionId: `TXN-${uuidv4()}`,
      processedAt: new Date(),
    };
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'test_user',
      password: 'test_pass',
      database: 'ticket_sales_test',
      entities: [
        EventOrmEntity,
        TicketConfigurationOrmEntity,
        ReservationOrmEntity,
        TicketOrmEntity,
        EventDetailsOrmEntity,
      ],
      synchronize: true,
      dropSchema: true,
    }),
    TypeOrmModule.forFeature([
      EventOrmEntity,
      TicketConfigurationOrmEntity,
      ReservationOrmEntity,
      TicketOrmEntity,
      EventDetailsOrmEntity,
    ]),
  ],
  controllers: [ReservationController, EventController],
  providers: [
    CreateReservationUseCase,
    CreateEventUseCase,
    ProcessPaymentUseCase,
    {
      provide: EVENT_REPOSITORY,
      useClass: TypeOrmEventRepository,
    },
    {
      provide: RESERVATION_REPOSITORY,
      useClass: TypeOrmReservationRepository,
    },
    {
      provide: TICKET_REPOSITORY,
      useClass: TypeOrmTicketRepository,
    },
    {
      provide: 'IPaymentGateway',
      useClass: MockPaymentGateway,
    },
  ],
})
class TestReservationModule {}

describe('ReservationController Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let mockPaymentGateway: MockPaymentGateway;
  let eventId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestReservationModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    mockPaymentGateway = moduleFixture.get<MockPaymentGateway>('IPaymentGateway');
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  beforeEach(async () => {
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repo = dataSource.getRepository(entity.name);
      await repo.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
    }

    // Create a test event for reservations
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const createEventDto = {
      name: 'Test Concert',
      date: futureDate.toISOString(),
      location: 'Test Venue',
      ticketConfigurations: [
        {
          type: TicketType.VIP,
          price: 150000,
          quantity: 10,
        },
        {
          type: TicketType.GENERAL,
          price: 100000,
          quantity: 20,
        },
      ],
    };

    const eventResponse = await request(app.getHttpServer())
      .post('/events')
      .send(createEventDto)
      .expect(201);

    eventId = eventResponse.body.id;
    mockPaymentGateway.setShouldFail(false);
  });

  describe('POST /reservations', () => {
    it('should create reservation and return 201', async () => {
      const createReservationDto = {
        eventId,
        ticketType: TicketType.VIP,
        quantity: 2,
        buyerEmail: 'buyer@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/reservations')
        .send(createReservationDto);

      if (response.status !== 201) {
        console.log('Response status:', response.status);
        console.log('Response body:', response.body);
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.eventId).toBe(eventId);
      expect(response.body.ticketType).toBe(TicketType.VIP);
      expect(response.body.quantity).toBe(2);
      expect(response.body.buyerEmail).toBe('buyer@example.com');
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body).toHaveProperty('expiresAt');
    });

    it('should return 409 when insufficient tickets available', async () => {
      // First, reserve 8 VIP tickets to leave only 2 available
      await request(app.getHttpServer())
        .post('/reservations')
        .send({
          eventId,
          ticketType: TicketType.VIP,
          quantity: 8,
          buyerEmail: 'buyer1@example.com',
        })
        .expect(201);

      // Now try to reserve 5 more VIP tickets (only 2 available)
      const createReservationDto = {
        eventId,
        ticketType: TicketType.VIP,
        quantity: 5,
        buyerEmail: 'buyer2@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/reservations')
        .send(createReservationDto);

      if (response.status !== 409) {
        console.log('Response status:', response.status);
        console.log('Response body:', response.body);
      }

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when quantity exceeds maximum', async () => {
      const createReservationDto = {
        eventId,
        ticketType: TicketType.VIP,
        quantity: 11, // Max is 10
        buyerEmail: 'buyer@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/reservations')
        .send(createReservationDto);

      expect(response.status).toBe(400);
    });

    it('should return 400 when email is invalid', async () => {
      const createReservationDto = {
        eventId,
        ticketType: TicketType.VIP,
        quantity: 2,
        buyerEmail: 'invalid-email',
      };

      const response = await request(app.getHttpServer())
        .post('/reservations')
        .send(createReservationDto);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /reservations/:id/payment', () => {
    it('should process payment and return 200 on success', async () => {
      // Create a reservation first
      const createReservationDto = {
        eventId,
        ticketType: TicketType.VIP,
        quantity: 2,
        buyerEmail: 'buyer@example.com',
      };

      const reservationResponse = await request(app.getHttpServer())
        .post('/reservations')
        .send(createReservationDto);

      const reservationId = reservationResponse.body.id;
      const totalAmount = reservationResponse.body.totalAmount;
      const currency = reservationResponse.body.currency;

      // Process payment
      const processPaymentDto = {
        amount: totalAmount,
        currency: currency,
      };

      mockPaymentGateway.setShouldFail(false);

      const paymentResponse = await request(app.getHttpServer())
        .post(`/reservations/${reservationId}/payment`)
        .send(processPaymentDto);

      if (paymentResponse.status !== 200) {
        console.log('Payment Response status:', paymentResponse.status);
        console.log('Payment Response body:', paymentResponse.body);
      }

      expect(paymentResponse.status).toBe(200);
      expect(paymentResponse.body.success).toBe(true);
      expect(paymentResponse.body).toHaveProperty('transactionId');
    });

    it('should handle payment failure and return 402', async () => {
      // Create a reservation first
      const createReservationDto = {
        eventId,
        ticketType: TicketType.VIP,
        quantity: 2,
        buyerEmail: 'buyer@example.com',
      };

      const reservationResponse = await request(app.getHttpServer())
        .post('/reservations')
        .send(createReservationDto);

      const reservationId = reservationResponse.body.id;
      const totalAmount = reservationResponse.body.totalAmount;
      const currency = reservationResponse.body.currency;

      // Process payment with failure
      const processPaymentDto = {
        amount: totalAmount,
        currency: currency,
      };

      mockPaymentGateway.setShouldFail(true);

      const paymentResponse = await request(app.getHttpServer())
        .post(`/reservations/${reservationId}/payment`)
        .send(processPaymentDto);

      if (paymentResponse.status !== 402) {
        console.log('Payment Response status:', paymentResponse.status);
        console.log('Payment Response body:', paymentResponse.body);
      }

      expect(paymentResponse.status).toBe(402);
      expect(paymentResponse.body.success).toBe(false);
      expect(paymentResponse.body).toHaveProperty('errorCode');
    });

    it('should return 404 when reservation does not exist', async () => {
      const nonExistentId = uuidv4();

      const processPaymentDto = {
        amount: 300000,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post(`/reservations/${nonExistentId}/payment`)
        .send(processPaymentDto);

      expect(response.status).toBe(404);
    });

    it('should return 400 when payment amount does not match reservation total', async () => {
      // Create a reservation first
      const createReservationDto = {
        eventId,
        ticketType: TicketType.VIP,
        quantity: 2,
        buyerEmail: 'buyer@example.com',
      };

      const reservationResponse = await request(app.getHttpServer())
        .post('/reservations')
        .send(createReservationDto);

      const reservationId = reservationResponse.body.id;

      // Process payment with wrong amount
      const processPaymentDto = {
        amount: 999999, // Wrong amount
        currency: 'USD',
      };

      const paymentResponse = await request(app.getHttpServer())
        .post(`/reservations/${reservationId}/payment`)
        .send(processPaymentDto);

      expect(paymentResponse.status).toBe(400);
    });
  });
});
