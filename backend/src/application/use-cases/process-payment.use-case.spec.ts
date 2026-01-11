import { ProcessPaymentUseCase } from "./process-payment.use-case";
import {
  IPaymentGateway,
  PaymentResult,
} from "../../domain/interfaces/payment-gateway.interface";
import { IReservationRepository } from "../../domain/interfaces/reservation-repository.interface";
import { ITicketRepository } from "../../domain/interfaces/ticket-repository.interface";
import { IEventRepository } from "../../domain/interfaces/event-repository.interface";
import { Reservation } from "../../domain/entities/reservation.entity";
import { Event } from "../../domain/entities/event.entity";
import { Ticket } from "../../domain/entities/ticket.entity";
import { TicketConfiguration } from "../../domain/entities/ticket-configuration.entity";
import { TicketType } from "../../domain/value-objects/ticket-type.vo";
import { Money } from "../../domain/value-objects/money.vo";
import { Email } from "../../domain/value-objects/email.vo";
import { TicketQuantity } from "../../domain/value-objects/ticket-quantity.vo";

/**
 * ProcessPaymentUseCase Tests
 *
 * Tests for the use case that processes payments for ticket reservations.
 * Validates that:
 * - Successful payments confirm reservations and generate tickets
 * - Failed payments cancel reservations and release tickets
 * - Payment amounts are validated against reservation totals
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 * - 4.1: Process payment with amount validation
 * - 4.2: Successful payment updates payment status to COMPLETED
 * - 4.3: Successful payment changes reservation to CONFIRMED
 * - 4.4: Successful payment generates tickets with correct data
 * - 4.5: Failed payment cancels reservation and releases tickets
 */
describe("ProcessPaymentUseCase", () => {
  let useCase: ProcessPaymentUseCase;
  let mockPaymentGateway: jest.Mocked<IPaymentGateway>;
  let mockReservationRepository: jest.Mocked<IReservationRepository>;
  let mockTicketRepository: jest.Mocked<ITicketRepository>;
  let mockEventRepository: jest.Mocked<IEventRepository>;

  beforeEach(() => {
    // Create mock repositories and gateway
    mockPaymentGateway = {
      processPayment: jest.fn(),
    };

    mockReservationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findExpired: jest.fn(),
      update: jest.fn(),
    };

    mockTicketRepository = {
      save: jest.fn(),
      saveMany: jest.fn(),
      findByBuyer: jest.fn(),
      findByEvent: jest.fn(),
    };

    mockEventRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    useCase = new ProcessPaymentUseCase(
      mockPaymentGateway,
      mockReservationRepository,
      mockTicketRepository,
      mockEventRepository,
    );
  });

  describe("execute", () => {
    it("should confirm reservation and generate tickets on successful payment", async () => {
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
        new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
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

      const successResult: PaymentResult = {
        success: true,
        transactionId: "txn-789",
        processedAt: new Date(),
      };

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockEventRepository.findById.mockResolvedValue(event);
      mockPaymentGateway.processPayment.mockResolvedValue(successResult);
      mockTicketRepository.saveMany.mockImplementation(
        async (tickets) => tickets,
      );

      const input = {
        reservationId,
        amount: totalAmount.amount,
        currency: totalAmount.currency,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("txn-789");

      // Verify reservation was confirmed
      expect(reservation.status).toBe("CONFIRMED");
      expect(mockReservationRepository.update).toHaveBeenCalledWith(
        reservation,
      );

      // Verify tickets were generated
      expect(mockTicketRepository.saveMany).toHaveBeenCalled();
      const savedTickets = (mockTicketRepository.saveMany as jest.Mock).mock
        .calls[0][0];
      expect(savedTickets).toHaveLength(2);
      expect(savedTickets[0].type).toBe(TicketType.VIP);
      expect(savedTickets[0].buyerEmail.value).toBe("buyer@example.com");
    });

    it("should cancel reservation and release tickets on failed payment", async () => {
      // Arrange
      const reservationId = "res-999";
      const eventId = "event-888";
      const buyerEmail = Email.create("buyer@example.com");
      const quantity = TicketQuantity.create(3);
      const totalAmount = Money.create(450000, "COP");

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

      const failureResult: PaymentResult = {
        success: false,
        errorCode: "CARD_DECLINED",
        errorMessage: "Card was declined",
      };

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockEventRepository.findById.mockResolvedValue(event);
      mockPaymentGateway.processPayment.mockResolvedValue(failureResult);

      const input = {
        reservationId,
        amount: totalAmount.amount,
        currency: totalAmount.currency,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("CARD_DECLINED");

      // Verify reservation was cancelled
      expect(reservation.status).toBe("CANCELLED");
      expect(mockReservationRepository.update).toHaveBeenCalledWith(
        reservation,
      );

      // Verify tickets were released (availability incremented)
      expect(event.getAvailability(TicketType.GENERAL)).toBe(100); // 97 + 3 released
      expect(mockEventRepository.update).toHaveBeenCalledWith(event);

      // Verify no tickets were generated
      expect(mockTicketRepository.saveMany).not.toHaveBeenCalled();
    });

    it("should reject if payment amount does not match reservation total", async () => {
      // Arrange
      const reservationId = "res-555";
      const eventId = "event-666";
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

      mockReservationRepository.findById.mockResolvedValue(reservation);

      const input = {
        reservationId,
        amount: 250000, // Wrong amount
        currency: "COP",
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        "Payment amount does not match reservation total",
      );

      // Verify payment gateway was not called
      expect(mockPaymentGateway.processPayment).not.toHaveBeenCalled();
    });

    it("should throw error if reservation not found", async () => {
      // Arrange
      mockReservationRepository.findById.mockResolvedValue(null);

      const input = {
        reservationId: "non-existent",
        amount: 100000,
        currency: "COP",
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        "Reservation not found",
      );
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
        TicketType.EARLY_BIRD,
        quantity,
        buyerEmail,
        totalAmount,
        new Date(Date.now() + 15 * 60 * 1000),
      );

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockEventRepository.findById.mockResolvedValue(null);

      const input = {
        reservationId,
        amount: totalAmount.amount,
        currency: totalAmount.currency,
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow("Event not found");
    });
  });
});
