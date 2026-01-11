import { ReleaseTicketsUseCase } from "./release-tickets.use-case";
import { IEventRepository } from "../../domain/interfaces/event-repository.interface";
import { IReservationRepository } from "../../domain/interfaces/reservation-repository.interface";
import { Reservation } from "../../domain/entities/reservation.entity";
import { Event } from "../../domain/entities/event.entity";
import { TicketConfiguration } from "../../domain/entities/ticket-configuration.entity";
import { TicketType } from "../../domain/value-objects/ticket-type.vo";
import { Money } from "../../domain/value-objects/money.vo";
import { Email } from "../../domain/value-objects/email.vo";
import { TicketQuantity } from "../../domain/value-objects/ticket-quantity.vo";

/**
 * ReleaseTicketsUseCase Tests
 *
 * Tests for the use case that releases tickets when payment fails or reservation expires.
 * Validates that:
 * - Tickets are released and availability is incremented
 * - Release events are logged with timestamp and reason
 * - Retry logic works correctly (up to 3 attempts)
 *
 * Requirements: 5.1, 5.2, 5.3, 5.5
 * - 5.1: Cancel reservation and increment availability
 * - 5.2: Register release event with timestamp and reason
 * - 5.3: Process release in less than 5 seconds
 * - 5.5: Retry up to 3 times before escalating
 */
describe("ReleaseTicketsUseCase", () => {
  let useCase: ReleaseTicketsUseCase;
  let mockEventRepository: jest.Mocked<IEventRepository>;
  let mockReservationRepository: jest.Mocked<IReservationRepository>;

  beforeEach(() => {
    mockEventRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    mockReservationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findExpired: jest.fn(),
      update: jest.fn(),
    };

    useCase = new ReleaseTicketsUseCase(
      mockEventRepository,
      mockReservationRepository,
    );
  });

  describe("execute", () => {
    it("should release tickets and increment availability", async () => {
      // Arrange
      const reservationId = "res-123";
      const eventId = "event-456";
      const buyerEmail = Email.create("buyer@example.com");
      const quantity = TicketQuantity.create(2);
      const totalAmount = Money.create(300000, "COP");

      const reservation = new Reservation(
        reservationId,
        eventId,
        TicketType.VIP,
        quantity,
        buyerEmail,
        totalAmount,
        new Date(Date.now() + 15 * 60 * 1000),
      );

      const event = new Event(
        eventId,
        "Concierto de Rock",
        new Date("2025-03-15T20:00:00Z"),
        "Estadio Nacional",
        [
          new TicketConfiguration(
            TicketType.VIP,
            Money.create(150000, "COP"),
            100,
            98, // 2 already reserved
          ),
        ],
      );

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockEventRepository.findById.mockResolvedValue(event);

      const input = {
        reservationId,
        reason: "Payment failed",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.ticketsReleased).toBe(2);

      // Verify availability was incremented
      expect(event.getAvailability(TicketType.VIP)).toBe(100);
      expect(mockEventRepository.update).toHaveBeenCalledWith(event);

      // Verify reservation was updated
      expect(mockReservationRepository.update).toHaveBeenCalledWith(
        reservation,
      );
    });

    it("should register release event with timestamp and reason", async () => {
      // Arrange
      const reservationId = "res-999";
      const eventId = "event-888";
      const buyerEmail = Email.create("buyer@example.com");
      const quantity = TicketQuantity.create(3);
      const totalAmount = Money.create(450000, "COP");
      const reason = "Reservation expired";

      const reservation = new Reservation(
        reservationId,
        eventId,
        TicketType.GENERAL,
        quantity,
        buyerEmail,
        totalAmount,
        new Date(Date.now() - 1000), // Already expired
      );

      const event = new Event(
        eventId,
        "Festival de Música",
        new Date("2025-04-20T18:00:00Z"),
        "Parque Arvi",
        [
          new TicketConfiguration(
            TicketType.GENERAL,
            Money.create(150000, "COP"),
            100,
            97, // 3 already reserved
          ),
        ],
      );

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockEventRepository.findById.mockResolvedValue(event);

      const input = {
        reservationId,
        reason,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.reason).toBe(reason);
      expect(result.releasedAt).toBeDefined();
      expect(result.releasedAt).toBeInstanceOf(Date);

      // Verify timestamp is recent (within last second)
      const timeDiff = Date.now() - result.releasedAt!.getTime();
      expect(timeDiff).toBeLessThan(1000);
    });

    it("should retry up to 3 times on failure", async () => {
      // Arrange
      const reservationId = "res-555";
      const eventId = "event-666";
      const buyerEmail = Email.create("buyer@example.com");
      const quantity = TicketQuantity.create(1);
      const totalAmount = Money.create(150000, "COP");

      const reservation = new Reservation(
        reservationId,
        eventId,
        TicketType.EARLY_BIRD,
        quantity,
        buyerEmail,
        totalAmount,
        new Date(Date.now() + 15 * 60 * 1000),
      );

      // Simulate repository failure on first 2 attempts, success on 3rd
      mockReservationRepository.findById
        .mockRejectedValueOnce(new Error("Database connection failed"))
        .mockRejectedValueOnce(new Error("Database connection failed"))
        .mockResolvedValueOnce(reservation);

      const event = new Event(
        eventId,
        "Concierto",
        new Date("2025-05-10T20:00:00Z"),
        "Teatro",
        [
          new TicketConfiguration(
            TicketType.EARLY_BIRD,
            Money.create(100000, "COP"),
            50,
            49, // 1 already reserved
          ),
        ],
      );

      mockEventRepository.findById.mockResolvedValue(event);

      const input = {
        reservationId,
        reason: "Payment failed",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.retryAttempts).toBe(3);
      expect(mockReservationRepository.findById).toHaveBeenCalledTimes(3);
    });

    it("should fail after 3 retry attempts", async () => {
      // Arrange
      const reservationId = "res-777";
      const eventId = "event-999";

      // Simulate persistent failure
      mockReservationRepository.findById.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const input = {
        reservationId,
        reason: "Payment failed",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.retryAttempts).toBe(3);
      expect(result.errorMessage).toBeDefined();
      expect(mockReservationRepository.findById).toHaveBeenCalledTimes(3);
    });

    it("should throw error if reservation not found", async () => {
      // Arrange
      mockReservationRepository.findById.mockResolvedValue(null);

      const input = {
        reservationId: "non-existent",
        reason: "Payment failed",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert - Should return failure result instead of throwing
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain("Reservation not found");
    });

    it("should throw error if event not found", async () => {
      // Arrange
      const reservationId = "res-111";
      const eventId = "event-222";
      const buyerEmail = Email.create("buyer@example.com");
      const quantity = TicketQuantity.create(1);
      const totalAmount = Money.create(150000, "COP");

      const reservation = new Reservation(
        reservationId,
        eventId,
        TicketType.VIP,
        quantity,
        buyerEmail,
        totalAmount,
        new Date(Date.now() + 15 * 60 * 1000),
      );

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockEventRepository.findById.mockResolvedValue(null);

      const input = {
        reservationId,
        reason: "Payment failed",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert - Should return failure result instead of throwing
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain("Event not found");
    });

    it("should handle empty reason gracefully", async () => {
      // Arrange
      const reservationId = "res-333";
      const eventId = "event-444";
      const buyerEmail = Email.create("buyer@example.com");
      const quantity = TicketQuantity.create(1);
      const totalAmount = Money.create(150000, "COP");

      const reservation = new Reservation(
        reservationId,
        eventId,
        TicketType.GENERAL,
        quantity,
        buyerEmail,
        totalAmount,
        new Date(Date.now() + 15 * 60 * 1000),
      );

      const event = new Event(
        eventId,
        "Evento",
        new Date("2025-06-01T20:00:00Z"),
        "Lugar",
        [
          new TicketConfiguration(
            TicketType.GENERAL,
            Money.create(150000, "COP"),
            100,
            99, // 1 already reserved
          ),
        ],
      );

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockEventRepository.findById.mockResolvedValue(event);

      const input = {
        reservationId,
        reason: "", // Empty reason
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.reason).toBe(""); // Should accept empty reason
    });
  });
});
