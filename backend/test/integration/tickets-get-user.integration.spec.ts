import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Module } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as cookieParser from 'cookie-parser';
import { TicketController } from '../../src/presentation/controllers/ticket.controller';
import { GetBuyerTicketsUseCase } from '../../src/application/use-cases/get-buyer-tickets.use-case';
import { PurchaseTicketUseCase } from '../../src/application/use-cases/purchase-ticket.use-case';
import { ValidateQRUseCase } from '../../src/application/use-cases/validate-qr.use-case';
import { TypeOrmEventRepository } from '../../src/infrastructure/persistence/repositories/typeorm-event.repository';
import { TypeOrmTicketRepository } from '../../src/infrastructure/persistence/repositories/typeorm-ticket.repository';
import { EventOrmEntity } from '../../src/infrastructure/persistence/entities/event.orm-entity';
import { TicketConfigurationOrmEntity } from '../../src/infrastructure/persistence/entities/ticket-configuration.orm-entity';
import { TicketOrmEntity } from '../../src/infrastructure/persistence/entities/ticket.orm-entity';
import { EventDetailsOrmEntity } from '../../src/infrastructure/persistence/entities/event-details.orm-entity';
import { JwtAuthGuard } from '../../src/application/services/jwt-auth.guard';
import { EVENT_REPOSITORY, TICKET_REPOSITORY } from '../../src/domain/interfaces/repository-tokens';
import { IPaymentGateway, PaymentResult, PaymentData } from '../../src/domain/interfaces/payment-gateway.interface';

/**
 * Mock Payment Gateway for testing
 */
class MockPaymentGateway implements IPaymentGateway {
  async processPayment(data: PaymentData): Promise<PaymentResult> {
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
      entities: [EventOrmEntity, TicketConfigurationOrmEntity, TicketOrmEntity, EventDetailsOrmEntity],
      synchronize: true,
      dropSchema: true,
    }),
    TypeOrmModule.forFeature([EventOrmEntity, TicketConfigurationOrmEntity, TicketOrmEntity, EventDetailsOrmEntity]),
    JwtModule.register({
      secret: 'test-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [TicketController],
  providers: [
    {
      provide: EVENT_REPOSITORY,
      useClass: TypeOrmEventRepository,
    },
    {
      provide: TICKET_REPOSITORY,
      useClass: TypeOrmTicketRepository,
    },
    {
      provide: 'IPaymentGateway',
      useClass: MockPaymentGateway,
    },
    GetBuyerTicketsUseCase,
    PurchaseTicketUseCase,
    ValidateQRUseCase,
    JwtAuthGuard,
  ],
})
class TestModule {}

describe('TicketController - GET /tickets/me and /tickets/user (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let eventRepository: TypeOrmEventRepository;
  let ticketRepository: TypeOrmTicketRepository;

  const testUser = {
    id: uuidv4(),
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  let authToken: string;
  let eventId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    eventRepository = moduleFixture.get<TypeOrmEventRepository>(EVENT_REPOSITORY);
    ticketRepository = moduleFixture.get<TypeOrmTicketRepository>(TICKET_REPOSITORY);

    // Generate JWT token for authentication
    authToken = jwtService.sign({
      sub: testUser.id,
      email: testUser.email,
      role: 'user',
    });
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await ticketRepository.clear();
    await eventRepository.clear();

    // Create a test event
    const event = await eventRepository.create({
      name: 'Test Concert 2026',
      description: 'Integration test event',
      date: new Date('2026-12-31'),
      location: 'Test Arena',
      organizerId: testUser.id,
      ticketConfigurations: [
        { type: 'GENERAL', price: 50, totalQuantity: 100, availableQuantity: 100 },
        { type: 'VIP', price: 150, totalQuantity: 50, availableQuantity: 50 },
      ],
    });

    eventId = event.id;
  });

  describe('GET /tickets/me', () => {
    it('should return empty array when user has no tickets', async () => {
      const response = await request(app.getHttpServer())
        .get('/tickets/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return tickets for authenticated user (Bearer token)', async () => {
      // Purchase tickets for test user
      await request(app.getHttpServer())
        .post('/tickets/purchase')
        .send({
          eventId,
          ticketType: 'GENERAL',
          quantity: 2,
          buyerEmail: testUser.email,
          paymentInfo: {
            cardNumber: '4111111111111111',
            expiryDate: '12/2027',
            cvv: '123',
          },
        })
        .expect(201);

      // Get tickets
      const response = await request(app.getHttpServer())
        .get('/tickets/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        eventId,
        type: 'GENERAL',
        buyerEmail: testUser.email,
        price: 50,
        currency: 'USD',
        status: 'PAID',
      });
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('code');
      expect(response.body[0]).toHaveProperty('qrToken');
      expect(response.body[0]).toHaveProperty('purchaseDate');
    });

    it('should return tickets for authenticated user (Cookie)', async () => {
      // Purchase tickets
      await request(app.getHttpServer())
        .post('/tickets/purchase')
        .send({
          eventId,
          ticketType: 'VIP',
          quantity: 1,
          buyerEmail: testUser.email,
          paymentInfo: {
            cardNumber: '4111111111111111',
            expiryDate: '12/2027',
            cvv: '123',
          },
        })
        .expect(201);

      // Get tickets using cookie
      const response = await request(app.getHttpServer())
        .get('/tickets/me')
        .set('Cookie', [`accessToken=${authToken}`])
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        eventId,
        type: 'VIP',
        buyerEmail: testUser.email,
        price: 150,
      });
    });

    it('should return 401 when no authentication provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/tickets/me')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when invalid token provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/tickets/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return only tickets for the authenticated user', async () => {
      // Create another user
      const anotherUser = {
        id: uuidv4(),
        email: 'another@example.com',
      };

      const anotherToken = jwtService.sign({
        sub: anotherUser.id,
        email: anotherUser.email,
        role: 'user',
      });

      // Purchase tickets for test user
      await request(app.getHttpServer())
        .post('/tickets/purchase')
        .send({
          eventId,
          ticketType: 'GENERAL',
          quantity: 2,
          buyerEmail: testUser.email,
          paymentInfo: {
            cardNumber: '4111111111111111',
            expiryDate: '12/2027',
            cvv: '123',
          },
        })
        .expect(201);

      // Purchase tickets for another user
      await request(app.getHttpServer())
        .post('/tickets/purchase')
        .send({
          eventId,
          ticketType: 'VIP',
          quantity: 3,
          buyerEmail: anotherUser.email,
          paymentInfo: {
            cardNumber: '4111111111111111',
            expiryDate: '12/2027',
            cvv: '123',
          },
        })
        .expect(201);

      // Get tickets for test user - should only see their own tickets
      const response = await request(app.getHttpServer())
        .get('/tickets/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every(ticket => ticket.buyerEmail === testUser.email)).toBe(true);

      // Get tickets for another user
      const anotherResponse = await request(app.getHttpServer())
        .get('/tickets/me')
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(200);

      expect(anotherResponse.body).toHaveLength(3);
      expect(anotherResponse.body.every(ticket => ticket.buyerEmail === anotherUser.email)).toBe(true);
    });

    it('should return tickets with correct structure', async () => {
      // Purchase a ticket
      await request(app.getHttpServer())
        .post('/tickets/purchase')
        .send({
          eventId,
          ticketType: 'GENERAL',
          quantity: 1,
          buyerEmail: testUser.email,
          paymentInfo: {
            cardNumber: '4111111111111111',
            expiryDate: '12/2027',
            cvv: '123',
          },
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/tickets/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const ticket = response.body[0];

      // Validate ticket structure
      expect(ticket).toHaveProperty('id');
      expect(ticket).toHaveProperty('code');
      expect(ticket).toHaveProperty('eventId');
      expect(ticket).toHaveProperty('type');
      expect(ticket).toHaveProperty('buyerEmail');
      expect(ticket).toHaveProperty('price');
      expect(ticket).toHaveProperty('currency');
      expect(ticket).toHaveProperty('purchaseDate');
      expect(ticket).toHaveProperty('qrToken');
      expect(ticket).toHaveProperty('status');
      expect(ticket).toHaveProperty('usedAt');

      // Validate ticket values
      expect(typeof ticket.id).toBe('string');
      expect(ticket.code).toMatch(/^TKT-[A-Z0-9]+$/);
      expect(ticket.eventId).toBe(eventId);
      expect(['GENERAL', 'VIP', 'PREMIUM']).toContain(ticket.type);
      expect(ticket.buyerEmail).toBe(testUser.email);
      expect(typeof ticket.price).toBe('number');
      expect(ticket.currency).toBe('USD');
      expect(new Date(ticket.purchaseDate).toString()).not.toBe('Invalid Date');
      expect(typeof ticket.qrToken).toBe('string');
      expect(['PAID', 'USED']).toContain(ticket.status);
      expect(ticket.usedAt).toBeNull(); // New tickets should not be used yet
    });
  });

  describe('GET /tickets/user', () => {
    it('should work identically to /tickets/me', async () => {
      // Purchase tickets
      await request(app.getHttpServer())
        .post('/tickets/purchase')
        .send({
          eventId,
          ticketType: 'GENERAL',
          quantity: 3,
          buyerEmail: testUser.email,
          paymentInfo: {
            cardNumber: '4111111111111111',
            expiryDate: '12/2027',
            cvv: '123',
          },
        })
        .expect(201);

      // Get tickets from /me
      const meResponse = await request(app.getHttpServer())
        .get('/tickets/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Get tickets from /user
      const userResponse = await request(app.getHttpServer())
        .get('/tickets/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Both should return identical results
      expect(meResponse.body).toHaveLength(3);
      expect(userResponse.body).toHaveLength(3);
      expect(meResponse.body).toEqual(userResponse.body);
    });
  });

  describe('Performance & Multiple Tickets', () => {
    it('should handle multiple ticket purchases efficiently', async () => {
      const purchaseCount = 5;
      const ticketsPerPurchase = 4;

      // Make multiple purchases
      for (let i = 0; i < purchaseCount; i++) {
        await request(app.getHttpServer())
          .post('/tickets/purchase')
          .send({
            eventId,
            ticketType: i % 2 === 0 ? 'GENERAL' : 'VIP',
            quantity: ticketsPerPurchase,
            buyerEmail: testUser.email,
            paymentInfo: {
              cardNumber: '4111111111111111',
              expiryDate: '12/2027',
              cvv: '123',
            },
          })
          .expect(201);
      }

      // Get all tickets
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/tickets/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const endTime = Date.now();

      expect(response.body).toHaveLength(purchaseCount * ticketsPerPurchase);
      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should sort tickets by purchase date (most recent first)', async () => {
      // Purchase tickets at different times
      await request(app.getHttpServer())
        .post('/tickets/purchase')
        .send({
          eventId,
          ticketType: 'GENERAL',
          quantity: 1,
          buyerEmail: testUser.email,
          paymentInfo: { cardNumber: '4111111111111111', expiryDate: '12/2027', cvv: '123' },
        })
        .expect(201);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      await request(app.getHttpServer())
        .post('/tickets/purchase')
        .send({
          eventId,
          ticketType: 'VIP',
          quantity: 1,
          buyerEmail: testUser.email,
          paymentInfo: { cardNumber: '4111111111111111', expiryDate: '12/2027', cvv: '123' },
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/tickets/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      
      // Verify tickets are sorted by purchase date (descending)
      const dates = response.body.map(t => new Date(t.purchaseDate).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });
  });
});
