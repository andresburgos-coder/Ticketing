import { DataSource, DataSourceOptions } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Ticket } from '../../src/domain/entities/ticket.entity';
import { TicketType } from '../../src/domain/value-objects/ticket-type.vo';
import { Email } from '../../src/domain/value-objects/email.vo';
import { Money } from '../../src/domain/value-objects/money.vo';
import { TypeOrmTicketRepository } from '../../src/infrastructure/persistence/repositories/typeorm-ticket.repository';
import { TicketOrmEntity } from '../../src/infrastructure/persistence/entities/ticket.orm-entity';

/**
 * Integration tests for TypeOrmTicketRepository
 * Tests the persistence layer's ability to save and retrieve Ticket entities
 * Requirements: 4.4, 6.1
 */
describe('TypeOrmTicketRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: TypeOrmTicketRepository;

  beforeAll(async () => {
    // Create a test data source
    const testDataSourceOptions: DataSourceOptions = {
      type: 'postgres',
      host: process.env.TEST_DATABASE_HOST ?? 'localhost',
      port: parseInt(process.env.TEST_DATABASE_PORT ?? '5433', 10),
      username: process.env.TEST_DATABASE_USER ?? 'test_user',
      password: process.env.TEST_DATABASE_PASSWORD ?? 'test_pass',
      database: process.env.TEST_DATABASE_NAME ?? 'ticket_sales_test',
      entities: [TicketOrmEntity],
      synchronize: true,
      dropSchema: true,
    };

    const testDataSource = new DataSource(testDataSourceOptions);
    dataSource = await testDataSource.initialize();
    repository = new TypeOrmTicketRepository(dataSource);
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
    it('should persist ticket and return with ID', async () => {
      // Arrange
      const ticketId = uuidv4();
      const eventId = uuidv4();
      const ticket = new Ticket(
        ticketId,
        'TKT-ABC123',
        eventId,
        TicketType.VIP,
        Email.create('buyer@example.com'),
        Money.create(150000, 'COP'),
        new Date('2025-03-15T20:00:00Z')
      );

      // Act
      const savedTicket = await repository.save(ticket);

      // Assert
      expect(savedTicket.id).toBe(ticketId);
      expect(savedTicket.code).toBe('TKT-ABC123');
      expect(savedTicket.eventId).toBe(eventId);
      expect(savedTicket.type).toBe(TicketType.VIP);
      expect(savedTicket.buyerEmail.value).toBe('buyer@example.com');
      expect(savedTicket.price.amount).toBe(150000);
      expect(savedTicket.price.currency).toBe('COP');
    });
  });

  describe('findByBuyer', () => {
    it('should return tickets for a specific buyer', async () => {
      // Arrange
      const buyerEmail = Email.create('buyer@example.com');
      const ticket1 = new Ticket(
        uuidv4(),
        'TKT-001',
        uuidv4(),
        TicketType.VIP,
        buyerEmail,
        Money.create(150000, 'COP'),
        new Date('2025-03-15T20:00:00Z')
      );

      const ticket2 = new Ticket(
        uuidv4(),
        'TKT-002',
        uuidv4(),
        TicketType.GENERAL,
        buyerEmail,
        Money.create(100000, 'COP'),
        new Date('2025-03-16T20:00:00Z')
      );

      const otherBuyerEmail = Email.create('other@example.com');
      const ticket3 = new Ticket(
        uuidv4(),
        'TKT-003',
        uuidv4(),
        TicketType.EARLY_BIRD,
        otherBuyerEmail,
        Money.create(80000, 'COP'),
        new Date('2025-03-17T20:00:00Z')
      );

      // Save all tickets
      await repository.save(ticket1);
      await repository.save(ticket2);
      await repository.save(ticket3);

      // Act
      const buyerTickets = await repository.findByBuyer(buyerEmail);

      // Assert
      expect(buyerTickets).toHaveLength(2);
      expect(buyerTickets.map((t) => t.id)).toContain(ticket1.id);
      expect(buyerTickets.map((t) => t.id)).toContain(ticket2.id);
      expect(buyerTickets.map((t) => t.id)).not.toContain(ticket3.id);
    });

    it('should return empty array when buyer has no tickets', async () => {
      // Arrange
      const buyerEmail = Email.create('notickets@example.com');

      // Act
      const buyerTickets = await repository.findByBuyer(buyerEmail);

      // Assert
      expect(buyerTickets).toEqual([]);
    });
  });

  describe('saveMany', () => {
    it('should persist multiple tickets in a single operation', async () => {
      // Arrange
      const buyerEmail = Email.create('buyer@example.com');
      const eventId = uuidv4();
      const tickets = [
        new Ticket(
          uuidv4(),
          'TKT-001',
          eventId,
          TicketType.VIP,
          buyerEmail,
          Money.create(150000, 'COP'),
          new Date('2025-03-15T20:00:00Z')
        ),
        new Ticket(
          uuidv4(),
          'TKT-002',
          eventId,
          TicketType.GENERAL,
          buyerEmail,
          Money.create(100000, 'COP'),
          new Date('2025-03-15T20:00:00Z')
        ),
        new Ticket(
          uuidv4(),
          'TKT-003',
          eventId,
          TicketType.EARLY_BIRD,
          buyerEmail,
          Money.create(80000, 'COP'),
          new Date('2025-03-15T20:00:00Z')
        ),
      ];

      // Act
      const savedTickets = await repository.saveMany(tickets);

      // Assert
      expect(savedTickets).toHaveLength(3);
      expect(savedTickets[0]).toBeDefined();
      expect(savedTickets[1]).toBeDefined();
      expect(savedTickets[2]).toBeDefined();
      expect(savedTickets[0]!.id).toBe(tickets[0]!.id);
      expect(savedTickets[1]!.id).toBe(tickets[1]!.id);
      expect(savedTickets[2]!.id).toBe(tickets[2]!.id);

      // Verify all tickets can be retrieved
      const retrievedTickets = await repository.findByBuyer(buyerEmail);
      expect(retrievedTickets).toHaveLength(3);
    });
  });

  describe('findByEvent', () => {
    it('should return all tickets for a specific event', async () => {
      // Arrange
      const eventId = uuidv4();
      const ticket1 = new Ticket(
        uuidv4(),
        'TKT-001',
        eventId,
        TicketType.VIP,
        Email.create('buyer1@example.com'),
        Money.create(150000, 'COP'),
        new Date('2025-03-15T20:00:00Z')
      );

      const ticket2 = new Ticket(
        uuidv4(),
        'TKT-002',
        eventId,
        TicketType.GENERAL,
        Email.create('buyer2@example.com'),
        Money.create(100000, 'COP'),
        new Date('2025-03-15T20:00:00Z')
      );

      const ticket3 = new Ticket(
        uuidv4(),
        'TKT-003',
        uuidv4(),
        TicketType.VIP,
        Email.create('buyer3@example.com'),
        Money.create(150000, 'COP'),
        new Date('2025-03-15T20:00:00Z')
      );

      // Save all tickets
      await repository.save(ticket1);
      await repository.save(ticket2);
      await repository.save(ticket3);

      // Act
      const eventTickets = await repository.findByEvent(eventId);

      // Assert
      expect(eventTickets).toHaveLength(2);
      expect(eventTickets.map((t) => t.id)).toContain(ticket1.id);
      expect(eventTickets.map((t) => t.id)).toContain(ticket2.id);
      expect(eventTickets.map((t) => t.id)).not.toContain(ticket3.id);
    });
  });
});
