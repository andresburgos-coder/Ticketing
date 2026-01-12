import { DataSource, DataSourceOptions } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Reservation } from "../../src/domain/entities/reservation.entity";
import { TicketType } from "../../src/domain/value-objects/ticket-type.vo";
import { TicketQuantity } from "../../src/domain/value-objects/ticket-quantity.vo";
import { Email } from "../../src/domain/value-objects/email.vo";
import { Money } from "../../src/domain/value-objects/money.vo";
import { TypeOrmReservationRepository } from "../../src/infrastructure/persistence/repositories/typeorm-reservation.repository";
import { ReservationOrmEntity } from "../../src/infrastructure/persistence/entities/reservation.orm-entity";

/**
 * Integration tests for TypeOrmReservationRepository
 * Tests the persistence layer's ability to save, retrieve, and update Reservation entities
 * Requirements: 3.1, 3.3, 3.4
 */
describe("TypeOrmReservationRepository Integration Tests", () => {
  let dataSource: DataSource;
  let repository: TypeOrmReservationRepository;

  beforeAll(async () => {
    // Create a test data source
    const testDataSourceOptions: DataSourceOptions = {
      type: "postgres",
      host: process.env.TEST_DATABASE_HOST ?? "localhost",
      port: parseInt(process.env.TEST_DATABASE_PORT ?? "5433", 10),
      username: process.env.TEST_DATABASE_USER ?? "test_user",
      password: process.env.TEST_PASS,
      database: process.env.TEST_DATABASE_NAME ?? "ticket_sales_test",
      entities: [ReservationOrmEntity],
      synchronize: true,
      dropSchema: true,
    };

    const testDataSource = new DataSource(testDataSourceOptions);
    dataSource = await testDataSource.initialize();
    repository = new TypeOrmReservationRepository(dataSource);
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

  describe("save", () => {
    it("should persist reservation and return with ID", async () => {
      // Arrange
      const reservationId = uuidv4();
      const eventId = uuidv4();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      const reservation = new Reservation(
        reservationId,
        eventId,
        TicketType.VIP,
        TicketQuantity.create(2),
        Email.create("buyer@example.com"),
        Money.create(300000, "COP"),
        expiresAt,
      );

      // Act
      const savedReservation = await repository.save(reservation);

      // Assert
      expect(savedReservation.id).toBe(reservationId);
      expect(savedReservation.eventId).toBe(eventId);
      expect(savedReservation.ticketType).toBe(TicketType.VIP);
      expect(savedReservation.quantity.value).toBe(2);
      expect(savedReservation.buyerEmail.value).toBe("buyer@example.com");
      expect(savedReservation.totalAmount.amount).toBe(300000);
      expect(savedReservation.status).toBe("ACTIVE");
    });
  });

  describe("findById", () => {
    it("should return reservation when it exists", async () => {
      // Arrange
      const reservationId = uuidv4();
      const eventId = uuidv4();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const reservation = new Reservation(
        reservationId,
        eventId,
        TicketType.GENERAL,
        TicketQuantity.create(1),
        Email.create("user@example.com"),
        Money.create(100000, "COP"),
        expiresAt,
      );

      // Save reservation first
      await repository.save(reservation);

      // Act
      const foundReservation = await repository.findById(reservationId);

      // Assert
      expect(foundReservation).not.toBeNull();
      expect(foundReservation?.id).toBe(reservationId);
      expect(foundReservation?.eventId).toBe(eventId);
      expect(foundReservation?.ticketType).toBe(TicketType.GENERAL);
      expect(foundReservation?.status).toBe("ACTIVE");
    });

    it("should return null when reservation does not exist", async () => {
      // Act
      const foundReservation = await repository.findById(uuidv4());

      // Assert
      expect(foundReservation).toBeNull();
    });
  });

  describe("findExpired", () => {
    it("should return reservations with expiresAt < now and status ACTIVE", async () => {
      // Arrange
      const now = new Date();
      const pastTime = new Date(now.getTime() - 1000); // 1 second ago
      const futureTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

      // Create expired reservation
      const expiredReservation = new Reservation(
        uuidv4(),
        uuidv4(),
        TicketType.VIP,
        TicketQuantity.create(1),
        Email.create("expired@example.com"),
        Money.create(150000, "COP"),
        pastTime,
      );

      // Create active reservation (not expired)
      const activeReservation = new Reservation(
        uuidv4(),
        uuidv4(),
        TicketType.GENERAL,
        TicketQuantity.create(2),
        Email.create("active@example.com"),
        Money.create(200000, "COP"),
        futureTime,
      );

      // Save both reservations
      const savedExpired = await repository.save(expiredReservation);
      await repository.save(activeReservation);

      // Act
      const expiredReservations = await repository.findExpired();

      // Assert
      expect(expiredReservations).toHaveLength(1);
      expect(expiredReservations[0]?.id).toBe(savedExpired.id);
      expect(expiredReservations[0]?.status).toBe("ACTIVE");
    });

    it("should not return non-ACTIVE reservations even if expired", async () => {
      // Arrange
      const pastTime = new Date(Date.now() - 1000);

      // Create expired but confirmed reservation
      const confirmedReservation = new Reservation(
        uuidv4(),
        uuidv4(),
        TicketType.EARLY_BIRD,
        TicketQuantity.create(3),
        Email.create("confirmed@example.com"),
        Money.create(240000, "COP"),
        pastTime,
      );

      // Confirm the reservation to change its status
      confirmedReservation.confirm();

      // Save the confirmed reservation
      await repository.save(confirmedReservation);

      // Act
      const expiredReservations = await repository.findExpired();

      // Assert
      expect(expiredReservations).toHaveLength(0);
    });
  });

  describe("update", () => {
    it("should update reservation status correctly", async () => {
      // Arrange
      const reservationId = uuidv4();
      const eventId = uuidv4();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const reservation = new Reservation(
        reservationId,
        eventId,
        TicketType.VIP,
        TicketQuantity.create(1),
        Email.create("update@example.com"),
        Money.create(150000, "COP"),
        expiresAt,
      );

      // Save initial reservation
      await repository.save(reservation);

      // Act - Confirm the reservation
      reservation.confirm();
      const updatedReservation = await repository.update(reservation.id, { status: reservation.status });

      // Assert
      expect(updatedReservation.id).toBe(reservationId);
      expect(updatedReservation.status).toBe("CONFIRMED");

      // Verify the update persisted
      const retrievedReservation = await repository.findById(reservationId);
      expect(retrievedReservation?.status).toBe("CONFIRMED");
    });

    it("should update reservation to EXPIRED status", async () => {
      // Arrange
      const reservationId = uuidv4();
      const eventId = uuidv4();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const reservation = new Reservation(
        reservationId,
        eventId,
        TicketType.GENERAL,
        TicketQuantity.create(2),
        Email.create("expire@example.com"),
        Money.create(200000, "COP"),
        expiresAt,
      );

      // Save initial reservation
      await repository.save(reservation);

      // Act - Expire the reservation
      reservation.expire();
      const updatedReservation = await repository.update(reservation.id, { status: reservation.status });

      // Assert
      expect(updatedReservation.status).toBe("EXPIRED");

      // Verify the update persisted
      const retrievedReservation = await repository.findById(reservationId);
      expect(retrievedReservation?.status).toBe("EXPIRED");
    });

    it("should update reservation to CANCELLED status", async () => {
      // Arrange
      const reservationId = uuidv4();
      const eventId = uuidv4();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const reservation = new Reservation(
        reservationId,
        eventId,
        TicketType.EARLY_BIRD,
        TicketQuantity.create(1),
        Email.create("cancel@example.com"),
        Money.create(80000, "COP"),
        expiresAt,
      );

      // Save initial reservation
      await repository.save(reservation);

      // Act - Cancel the reservation
      reservation.cancel();
      const updatedReservation = await repository.update(reservation.id, { status: reservation.status });

      // Assert
      expect(updatedReservation.status).toBe("CANCELLED");

      // Verify the update persisted
      const retrievedReservation = await repository.findById(reservationId);
      expect(retrievedReservation?.status).toBe("CANCELLED");
    });
  });
});
