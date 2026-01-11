import { DataSource, DataSourceOptions } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Event } from '../../src/domain/entities/event.entity';
import { TicketConfiguration } from '../../src/domain/entities/ticket-configuration.entity';
import { TicketType } from '../../src/domain/value-objects/ticket-type.vo';
import { Money } from '../../src/domain/value-objects/money.vo';
import { TypeOrmEventRepository } from '../../src/infrastructure/persistence/repositories/typeorm-event.repository';
import { EventOrmEntity } from '../../src/infrastructure/persistence/entities/event.orm-entity';
import { TicketConfigurationOrmEntity } from '../../src/infrastructure/persistence/entities/ticket-configuration.orm-entity';
import { EventDetailsOrmEntity } from '../../src/infrastructure/persistence/entities/event-details.orm-entity';

/**
 * Integration tests for TypeOrmEventRepository
 * Tests the persistence layer's ability to save and retrieve Event entities
 * Requirements: 1.1, 1.3, 1.4
 */
describe('TypeOrmEventRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: TypeOrmEventRepository;

  beforeAll(async () => {
    // Create a test data source
    const testDataSourceOptions: DataSourceOptions = {
      type: 'postgres',
      host: process.env.TEST_DATABASE_HOST ?? 'localhost',
      port: parseInt(process.env.TEST_DATABASE_PORT ?? '5433', 10),
      username: process.env.TEST_DATABASE_USER ?? 'test_user',
      password: process.env.TEST_DATABASE_PASSWORD ?? 'test_pass',
      database: process.env.TEST_DATABASE_NAME ?? 'ticket_sales_test',
      entities: [EventOrmEntity, TicketConfigurationOrmEntity, EventDetailsOrmEntity],
      synchronize: true,
      dropSchema: true,
    };

    const testDataSource = new DataSource(testDataSourceOptions);
    dataSource = await testDataSource.initialize();
    repository = new TypeOrmEventRepository(dataSource);
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clear all tables before each test
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repo = dataSource.getRepository(entity.name);
      await repo.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
    }
  });

  describe('save', () => {
    it('should persist event and return with ID', async () => {
      // Arrange
      const eventId = uuidv4();
      const ticketConfigs = [
        new TicketConfiguration(
          TicketType.VIP,
          Money.create(150000, 'COP'),
          100,
          100
        ),
        new TicketConfiguration(
          TicketType.GENERAL,
          Money.create(100000, 'COP'),
          200,
          200
        ),
      ];

      const event = new Event(
        eventId,
        'Concierto de Rock',
        new Date('2025-03-15T20:00:00Z'),
        'Estadio Nacional',
        ticketConfigs
      );

      // Act
      const savedEvent = await repository.save(event);

      // Assert
      expect(savedEvent.id).toBe(eventId);
      expect(savedEvent.name).toBe('Concierto de Rock');
      expect(savedEvent.ticketConfigurations).toHaveLength(2);
      expect(savedEvent.location).toBe('Estadio Nacional');
    });
  });

  describe('findById', () => {
    it('should return event when it exists', async () => {
      // Arrange
      const eventId = uuidv4();
      const ticketConfigs = [
        new TicketConfiguration(
          TicketType.VIP,
          Money.create(150000, 'COP'),
          100,
          100
        ),
      ];

      const event = new Event(
        eventId,
        'Festival de Música',
        new Date('2025-04-20T18:00:00Z'),
        'Parque Central',
        ticketConfigs
      );

      // Save event first
      await repository.save(event);

      // Act
      const foundEvent = await repository.findById(eventId);

      // Assert
      expect(foundEvent).not.toBeNull();
      expect(foundEvent?.name).toBe('Festival de Música');
      expect(foundEvent?.location).toBe('Parque Central');
      expect(foundEvent?.ticketConfigurations).toHaveLength(1);
    });

    it('should return null when event does not exist', async () => {
      // Act
      const foundEvent = await repository.findById(uuidv4());

      // Assert
      expect(foundEvent).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all events', async () => {
      // Arrange
      const event1 = new Event(
        uuidv4(),
        'Concierto 1',
        new Date('2025-03-15T20:00:00Z'),
        'Lugar 1',
        [
          new TicketConfiguration(
            TicketType.VIP,
            Money.create(150000, 'COP'),
            100,
            100
          ),
        ]
      );

      const event2 = new Event(
        uuidv4(),
        'Concierto 2',
        new Date('2025-04-20T20:00:00Z'),
        'Lugar 2',
        [
          new TicketConfiguration(
            TicketType.GENERAL,
            Money.create(100000, 'COP'),
            200,
            200
          ),
        ]
      );

      // Save events
      await repository.save(event1);
      await repository.save(event2);

      // Act
      const allEvents = await repository.findAll();

      // Assert
      expect(allEvents).toHaveLength(2);
      expect(allEvents.map(e => e.name)).toContain('Concierto 1');
      expect(allEvents.map(e => e.name)).toContain('Concierto 2');
    });

    it('should return empty array when no events exist', async () => {
      // Act
      const allEvents = await repository.findAll();

      // Assert
      expect(allEvents).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update an existing event', async () => {
      // Arrange
      const eventId = uuidv4();
      const originalEvent = new Event(
        eventId,
        'Original Name',
        new Date('2025-03-15T20:00:00Z'),
        'Original Location',
        [
          new TicketConfiguration(
            TicketType.VIP,
            Money.create(150000, 'COP'),
            100,
            100
          ),
        ]
      );

      // Save original event
      await repository.save(originalEvent);

      // Create updated event with same ID but different data
      const updatedEvent = new Event(
        eventId,
        'Updated Name',
        new Date('2025-03-15T20:00:00Z'),
        'Updated Location',
        [
          new TicketConfiguration(
            TicketType.VIP,
            Money.create(150000, 'COP'),
            100,
            100
          ),
        ]
      );

      // Act
      const result = await repository.update(updatedEvent);

      // Assert
      expect(result.id).toBe(eventId);
      expect(result.name).toBe('Updated Name');
      expect(result.location).toBe('Updated Location');

      // Verify by fetching
      const fetched = await repository.findById(eventId);
      expect(fetched?.name).toBe('Updated Name');
      expect(fetched?.location).toBe('Updated Location');
    });
  });
});
