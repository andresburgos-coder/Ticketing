import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Module } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { EventController } from '../../src/presentation/controllers/event.controller';
import { CreateEventUseCase } from '../../src/application/use-cases/create-event.use-case';
import { TypeOrmEventRepository } from '../../src/infrastructure/persistence/repositories/typeorm-event.repository';
import { EventOrmEntity } from '../../src/infrastructure/persistence/entities/event.orm-entity';
import { TicketConfigurationOrmEntity } from '../../src/infrastructure/persistence/entities/ticket-configuration.orm-entity';
import { TicketType } from '../../src/domain/value-objects/ticket-type.vo';
import { EVENT_REPOSITORY } from '../../src/domain/interfaces/repository-tokens';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'test_user',
      password: 'test_pass',
      database: 'ticket_sales_test',
      entities: [EventOrmEntity, TicketConfigurationOrmEntity],
      synchronize: true,
      dropSchema: true,
    }),
    TypeOrmModule.forFeature([EventOrmEntity, TicketConfigurationOrmEntity]),
  ],
  controllers: [EventController],
  providers: [
    CreateEventUseCase,
    {
      provide: EVENT_REPOSITORY,
      useClass: TypeOrmEventRepository,
    },
  ],
})
class TestEventModule {}

describe('EventController Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestEventModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
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
  });

  describe('POST /events', () => {
    it('should create event and return 201', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const createEventDto = {
        name: 'Concierto de Rock',
        date: futureDate.toISOString(),
        location: 'Estadio Nacional',
        ticketConfigurations: [
          {
            type: TicketType.VIP,
            price: 150000,
            quantity: 100,
          },
          {
            type: TicketType.GENERAL,
            price: 100000,
            quantity: 200,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(createEventDto);

      if (response.status !== 201) {
        console.log('Response status:', response.status);
        console.log('Response body:', response.body);
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Concierto de Rock');
      expect(response.body.location).toBe('Estadio Nacional');
      expect(response.body.ticketConfigurations).toHaveLength(2);
      expect(response.body.ticketConfigurations[0].type).toBe(TicketType.VIP);
      expect(response.body.ticketConfigurations[0].price).toBe(150000);
      expect(response.body.ticketConfigurations[0].availableQuantity).toBe(100);
    });

    it('should return 400 when event name is missing', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const createEventDto = {
        date: futureDate.toISOString(),
        location: 'Estadio Nacional',
        ticketConfigurations: [
          {
            type: TicketType.VIP,
            price: 150000,
            quantity: 100,
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/events')
        .send(createEventDto)
        .expect(400);
    });

    it('should return 400 when ticket configurations are missing', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const createEventDto = {
        name: 'Concierto de Rock',
        date: futureDate.toISOString(),
        location: 'Estadio Nacional',
        ticketConfigurations: [],
      };

      await request(app.getHttpServer())
        .post('/events')
        .send(createEventDto)
        .expect(400);
    });
  });

  describe('GET /events/:id', () => {
    it('should return event when it exists', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const createEventDto = {
        name: 'Festival de Música',
        date: futureDate.toISOString(),
        location: 'Parque Central',
        ticketConfigurations: [
          {
            type: TicketType.VIP,
            price: 150000,
            quantity: 100,
          },
        ],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/events')
        .send(createEventDto)
        .expect(201);

      const eventId = createResponse.body.id;

      const getResponse = await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(eventId);
      expect(getResponse.body.name).toBe('Festival de Música');
      expect(getResponse.body.location).toBe('Parque Central');
      expect(getResponse.body.ticketConfigurations).toHaveLength(1);
    });

    it('should return 404 when event does not exist', async () => {
      const nonExistentId = uuidv4();

      await request(app.getHttpServer())
        .get(`/events/${nonExistentId}`)
        .expect(404);
    });
  });
});
