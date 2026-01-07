import * as fc from 'fast-check';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Event } from '../../src/domain/entities/event.entity';
import { TicketConfiguration } from '../../src/domain/entities/ticket-configuration.entity';
import { Money } from '../../src/domain/value-objects/money.vo';
import { TicketType } from '../../src/domain/value-objects/ticket-type.vo';
import { TypeOrmEventRepository } from '../../src/infrastructure/persistence/repositories/typeorm-event.repository';
import { EventOrmEntity } from '../../src/infrastructure/persistence/entities/event.orm-entity';
import { TicketConfigurationOrmEntity } from '../../src/infrastructure/persistence/entities/ticket-configuration.orm-entity';

/**
 * Property Test: Event Persistence Round-Trip
 * 
 * Property 1: Event Persistence Round-Trip
 * For any valid Event, persisting it to the database and retrieving it by ID
 * should produce an equivalent Event with all data intact.
 * 
 * Validates: Requirements 1.1, 1.3, 8.3
 * - 1.1: Event persists and returns with unique identifier
 * - 1.3: Event returns with all ticket types and current availability
 * - 8.3: Serialization/deserialization produces equivalent object
 */
describe('Event Persistence Round-Trip Property Test', () => {
  let dataSource: DataSource;
  let repository: TypeOrmEventRepository;

  beforeAll(async () => {
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
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repo = dataSource.getRepository(entity.name);
      await repo.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
    }
  });

  it('should preserve Event data through persistence round-trip', async () => {
    // Generator for ticket configurations
    const ticketConfigArbitrary = fc.record({
      type: fc.constantFrom(TicketType.VIP, TicketType.GENERAL, TicketType.EARLY_BIRD),
      price: fc.integer({ min: 10000, max: 500000 }),
      totalQuantity: fc.integer({ min: 10, max: 1000 }),
    }).chain((config) =>
      fc.integer({ min: 0, max: config.totalQuantity }).map((availableQuantity) => ({
        ...config,
        availableQuantity,
      }))
    );

    // Generator for Event data
    const eventArbitrary = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      date: fc.date({
        min: new Date(),
        max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }),
      location: fc.string({ minLength: 1, maxLength: 100 }),
      ticketConfigurations: fc
        .array(ticketConfigArbitrary, { minLength: 1, maxLength: 3 })
        .map((configs) => {
          // Ensure unique ticket types
          const uniqueConfigs = configs.reduce(
            (acc, config) => {
              if (!acc.some((c) => c.type === config.type)) {
                acc.push(config);
              }
              return acc;
            },
            [] as typeof configs
          );
          return uniqueConfigs;
        }),
    });

    // Property: For any valid Event, round-trip persistence should preserve all data
    await fc.assert(
      fc.asyncProperty(eventArbitrary, async (eventData) => {
        // Arrange: Create domain Event
        const ticketConfigs = eventData.ticketConfigurations.map(
          (config) =>
            new TicketConfiguration(
              config.type,
              Money.create(config.price, 'COP'),
              config.totalQuantity,
              config.availableQuantity
            )
        );

        const originalEvent = new Event(
          eventData.id,
          eventData.name,
          eventData.date,
          eventData.location,
          ticketConfigs
        );

        // Act: Persist and retrieve
        await repository.save(originalEvent);
        const retrievedEvent = await repository.findById(eventData.id);

        // Assert: Verify round-trip equivalence
        expect(retrievedEvent).not.toBeNull();
        expect(retrievedEvent!.id).toBe(originalEvent.id);
        expect(retrievedEvent!.name).toBe(originalEvent.name);
        expect(retrievedEvent!.location).toBe(originalEvent.location);
        
        // Verify date is preserved (accounting for potential millisecond precision loss)
        expect(retrievedEvent!.date.getTime()).toBe(originalEvent.date.getTime());

        // Verify ticket configurations are preserved
        expect(retrievedEvent!.ticketConfigurations).toHaveLength(
          originalEvent.ticketConfigurations.length
        );

        for (let i = 0; i < originalEvent.ticketConfigurations.length; i++) {
          const originalConfig = originalEvent.ticketConfigurations[i];
          const retrievedConfig = retrievedEvent!.ticketConfigurations[i];

          if (!originalConfig || !retrievedConfig) {
            throw new Error(`Missing configuration at index ${i}`);
          }

          expect(retrievedConfig.type).toBe(originalConfig.type);
          expect(retrievedConfig.price.amount).toBe(originalConfig.price.amount);
          expect(retrievedConfig.price.currency).toBe(originalConfig.price.currency);
          expect(retrievedConfig.totalQuantity).toBe(originalConfig.totalQuantity);
          expect(retrievedConfig.availableQuantity).toBe(originalConfig.availableQuantity);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain availability invariant after persistence', async () => {
    // Generator for Event with operations
    const eventWithOperationsArbitrary = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      date: fc.date({
        min: new Date(),
        max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }),
      location: fc.string({ minLength: 1, maxLength: 100 }),
      initialAvailability: fc.integer({ min: 50, max: 500 }),
    });

    await fc.assert(
      fc.asyncProperty(eventWithOperationsArbitrary, async (data) => {
        // Arrange: Create Event with VIP tickets
        const ticketConfigs = [
          new TicketConfiguration(
            TicketType.VIP,
            Money.create(150000, 'COP'),
            100,
            data.initialAvailability
          ),
        ];

        const event = new Event(data.id, data.name, data.date, data.location, ticketConfigs);

        // Act: Save, retrieve, and verify availability
        await repository.save(event);
        const retrievedEvent = await repository.findById(data.id);

        // Assert: Availability should be preserved
        expect(retrievedEvent!.getAvailability(TicketType.VIP)).toBe(data.initialAvailability);
      }),
      { numRuns: 100 }
    );
  });
});
