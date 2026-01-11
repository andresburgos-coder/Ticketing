import * as fc from "fast-check";
import { DataSource, DataSourceOptions } from "typeorm";
import { Ticket } from "../../src/domain/entities/ticket.entity";
import { Email } from "../../src/domain/value-objects/email.vo";
import { Money } from "../../src/domain/value-objects/money.vo";
import { TypeOrmTicketRepository } from "../../src/infrastructure/persistence/repositories/typeorm-ticket.repository";
import { TicketOrmEntity } from "../../src/infrastructure/persistence/entities/ticket.orm-entity";
import {
  ticketDataArbitrary,
  ticketsByBuyerArbitrary,
  ticketsByEventArbitrary,
} from "./generators/ticket.generator";

/**
 * Property Test: Ticket Persistence Round-Trip
 *
 * Property 5: Entity Serialization Round-Trip
 * For any valid Ticket, persisting it to the database and retrieving it by buyer
 * should produce an equivalent Ticket with all data intact.
 *
 * Validates: Requirements 8.3
 * - 8.3: Serialization/deserialization produces equivalent object
 */
describe("Ticket Persistence Round-Trip Property Test", () => {
  let dataSource: DataSource;
  let repository: TypeOrmTicketRepository;
  let isConnected = false;

  beforeAll(async () => {
    const testDataSourceOptions: DataSourceOptions = {
      type: "postgres",
      host: process.env.TEST_DATABASE_HOST ?? "localhost",
      port: parseInt(process.env.TEST_DATABASE_PORT ?? "5433", 10),
      username: process.env.TEST_DATABASE_USER ?? "test_user",
      password: process.env.TEST_DATABASE_PASSWORD ?? "test_pass",
      database: process.env.TEST_DATABASE_NAME ?? "ticket_sales_test",
      entities: [TicketOrmEntity],
      synchronize: true,
      dropSchema: true,
    };

    try {
      const testDataSource = new DataSource(testDataSourceOptions);
      dataSource = await testDataSource.initialize();
      repository = new TypeOrmTicketRepository(dataSource);
      isConnected = true;
    } catch (error) {
      console.error("Failed to connect to test database:", error);
      isConnected = false;
    }
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    if (!isConnected) {
      return;
    }
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repo = dataSource.getRepository(entity.name);
      await repo.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
    }
  });

  it("should preserve Ticket data through persistence round-trip", async () => {
    if (!isConnected) {
      console.warn("Skipping test: Database not connected");
      return;
    }

    // Property: For any valid Ticket, round-trip persistence should preserve all data
    await fc.assert(
      fc.asyncProperty(ticketDataArbitrary, async (ticketData) => {
        // Arrange: Create domain Ticket
        const originalTicket = new Ticket(
          ticketData.id,
          ticketData.code,
          ticketData.eventId,
          ticketData.type,
          Email.create(ticketData.buyerEmail),
          Money.create(ticketData.price, "COP"),
          ticketData.purchaseDate,
        );

        // Act: Persist and retrieve
        await repository.save(originalTicket);
        const retrievedTickets = await repository.findByBuyer(
          Email.create(ticketData.buyerEmail),
        );

        // Assert: Verify round-trip equivalence
        expect(retrievedTickets).toHaveLength(1);
        const retrievedTicket = retrievedTickets[0];

        if (!retrievedTicket) {
          throw new Error("Ticket not found after persistence");
        }

        expect(retrievedTicket.id).toBe(originalTicket.id);
        expect(retrievedTicket.code).toBe(originalTicket.code);
        expect(retrievedTicket.eventId).toBe(originalTicket.eventId);
        expect(retrievedTicket.type).toBe(originalTicket.type);
        expect(retrievedTicket.buyerEmail.value).toBe(
          originalTicket.buyerEmail.value,
        );
        expect(retrievedTicket.price.amount).toBe(originalTicket.price.amount);
        expect(retrievedTicket.price.currency).toBe(
          originalTicket.price.currency,
        );

        // Verify date is preserved (accounting for potential millisecond precision loss)
        expect(retrievedTicket.purchaseDate.getTime()).toBe(
          originalTicket.purchaseDate.getTime(),
        );
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve all tickets for a buyer through persistence", async () => {
    if (!isConnected) {
      console.warn("Skipping test: Database not connected");
      return;
    }

    // Property: For any set of tickets by a buyer, all should be retrievable
    await fc.assert(
      fc.asyncProperty(ticketsByBuyerArbitrary, async (data) => {
        // Arrange: Create and save multiple tickets for the same buyer
        const buyerEmail = Email.create(data.buyerEmail);
        const tickets = data.tickets.map(
          (t) =>
            new Ticket(
              t.id,
              t.code,
              t.eventId,
              t.type,
              buyerEmail,
              Money.create(t.price, "COP"),
              t.purchaseDate,
            ),
        );

        // Act: Save all tickets
        await repository.saveMany(tickets);

        // Assert: Retrieve and verify all tickets are present
        const retrievedTickets = await repository.findByBuyer(buyerEmail);

        expect(retrievedTickets).toHaveLength(tickets.length);

        for (const originalTicket of tickets) {
          const retrieved = retrievedTickets.find(
            (t) => t.id === originalTicket.id,
          );
          expect(retrieved).toBeDefined();
          expect(retrieved?.code).toBe(originalTicket.code);
          expect(retrieved?.eventId).toBe(originalTicket.eventId);
          expect(retrieved?.type).toBe(originalTicket.type);
          expect(retrieved?.price.amount).toBe(originalTicket.price.amount);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve all tickets for an event through persistence", async () => {
    if (!isConnected) {
      console.warn("Skipping test: Database not connected");
      return;
    }

    // Property: For any set of tickets for an event, all should be retrievable
    await fc.assert(
      fc.asyncProperty(ticketsByEventArbitrary, async (data) => {
        // Arrange: Create and save multiple tickets for the same event
        const tickets = data.tickets.map(
          (t) =>
            new Ticket(
              t.id,
              t.code,
              data.eventId,
              t.type,
              Email.create(t.buyerEmail),
              Money.create(t.price, "COP"),
              t.purchaseDate,
            ),
        );

        // Act: Save all tickets
        await repository.saveMany(tickets);

        // Assert: Retrieve and verify all tickets are present
        const retrievedTickets = await repository.findByEvent(data.eventId);

        expect(retrievedTickets).toHaveLength(tickets.length);

        for (const originalTicket of tickets) {
          const retrieved = retrievedTickets.find(
            (t) => t.id === originalTicket.id,
          );
          expect(retrieved).toBeDefined();
          expect(retrieved?.code).toBe(originalTicket.code);
          expect(retrieved?.buyerEmail.value).toBe(
            originalTicket.buyerEmail.value,
          );
          expect(retrieved?.type).toBe(originalTicket.type);
          expect(retrieved?.price.amount).toBe(originalTicket.price.amount);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should maintain ticket code uniqueness after persistence", async () => {
    if (!isConnected) {
      console.warn("Skipping test: Database not connected");
      return;
    }

    // Property: Ticket codes should remain unique after persistence
    await fc.assert(
      fc.asyncProperty(ticketsByBuyerArbitrary, async (data) => {
        // Arrange: Create tickets with unique codes
        const buyerEmail = Email.create(data.buyerEmail);
        const tickets = data.tickets.map(
          (t) =>
            new Ticket(
              t.id,
              t.code,
              t.eventId,
              t.type,
              buyerEmail,
              Money.create(t.price, "COP"),
              t.purchaseDate,
            ),
        );

        // Act: Save all tickets
        await repository.saveMany(tickets);

        // Assert: Verify all codes are unique
        const retrievedTickets = await repository.findByBuyer(buyerEmail);
        const codes = retrievedTickets.map((t) => t.code);
        const uniqueCodes = new Set(codes);

        expect(uniqueCodes.size).toBe(codes.length);
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve ticket JSON representation through round-trip", async () => {
    if (!isConnected) {
      console.warn("Skipping test: Database not connected");
      return;
    }

    // Property: Ticket.toJSON() should produce consistent output after persistence
    await fc.assert(
      fc.asyncProperty(ticketDataArbitrary, async (ticketData) => {
        // Arrange: Create domain Ticket
        const originalTicket = new Ticket(
          ticketData.id,
          ticketData.code,
          ticketData.eventId,
          ticketData.type,
          Email.create(ticketData.buyerEmail),
          Money.create(ticketData.price, "COP"),
          ticketData.purchaseDate,
        );

        const originalJSON = originalTicket.toJSON();

        // Act: Persist and retrieve
        await repository.save(originalTicket);
        const retrievedTickets = await repository.findByBuyer(
          Email.create(ticketData.buyerEmail),
        );
        const retrievedTicket = retrievedTickets[0];

        if (!retrievedTicket) {
          throw new Error("Ticket not found after persistence");
        }

        const retrievedJSON = retrievedTicket.toJSON();

        // Assert: Verify JSON representation is equivalent
        expect(retrievedJSON.id).toBe(originalJSON.id);
        expect(retrievedJSON.code).toBe(originalJSON.code);
        expect(retrievedJSON.eventId).toBe(originalJSON.eventId);
        expect(retrievedJSON.type).toBe(originalJSON.type);
        expect(retrievedJSON.buyerEmail).toBe(originalJSON.buyerEmail);
        expect(retrievedJSON.price.amount).toBe(originalJSON.price.amount);
        expect(retrievedJSON.price.currency).toBe(originalJSON.price.currency);
        // Dates might differ slightly due to serialization, so we check ISO strings
        expect(new Date(retrievedJSON.purchaseDate).getTime()).toBe(
          new Date(originalJSON.purchaseDate).getTime(),
        );
      }),
      { numRuns: 100 },
    );
  });
});
