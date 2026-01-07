import { DataSource, DataSourceOptions } from 'typeorm';
import { Event } from '../../src/domain/entities/event.entity';
import { TicketConfiguration } from '../../src/domain/entities/ticket-configuration.entity';
import { TicketType } from '../../src/domain/value-objects/ticket-type.vo';
import { Money } from '../../src/domain/value-objects/money.vo';
import { TypeOrmEventRepository } from '../../src/infrastructure/persistence/repositories/typeorm-event.repository';
import { EventOrmEntity } from '../../src/infrastructure/persistence/entities/event.orm-entity';
import { TicketConfigurationOrmEntity } from '../../src/infrastructure/persistence/entities/ticket-configuration.orm-entity';

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
      entities: [EventOrmEntity, TicketConfigurationOrmEntity],
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
        'event-123',
        'Concierto de Rock',
        new Date('2025-03-15T20:00:00Z'),
        'Estadio Nacional',
        ticketConfigs
      );

      // Act
      const savedEvent = await repository.save(event);

      // Assert
      expect(savedEvent.id).toBe('event-123');
      expect(savedEvent.name).toBe('Concierto de Rock');
      expect(savedEvent.ticketConfigurations).toHaveLength(2);
      expect(savedEvent.location).toBe('Estadio Nacional');
    });
  });

  describe('findById', () => {
    it('should return event when it exists', async () => {
      // Arrange
      const ticketConfigs = [
        new TicketConfiguration(
          TicketType.VIP,
          Money.create(150000, 'COP'),
          100,
          100
        ),
      ];

      const event = new Event(
        'event-456',
        'Festival de Música',
        new Date('2025-04-20T18:00:00Z'),
        'Parque Central',
        ticketConfigs
      );

      // Save event first
      await repository.save(event);

      // Act
      const foundEvent = await repository.findById('event-456');

      // Assert
      expect(foundEvent).not.toBeNull();
      expect(foundEvent?.name).toBe('Festival de Música');
      expect(foundEvent?.location).toBe('Parque Central');
      expect(foundEvent?.ticketConfigurations).toHaveLength(1);
    });

    it('should return null when event does not exist', async () => {
      // Act
      const foundEvent = await repository.findById('non-existent-id');

      // Assert
      expect(foundEvent).toBeNull();
    });
  });
});
