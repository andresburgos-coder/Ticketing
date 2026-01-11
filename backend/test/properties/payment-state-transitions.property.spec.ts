import * as fc from "fast-check";
import { ProcessPaymentUseCase } from "../../src/application/use-cases/process-payment.use-case";
import {
  IPaymentGateway,
  PaymentResult,
} from "../../src/domain/interfaces/payment-gateway.interface";
import { IReservationRepository } from "../../src/domain/interfaces/reservation-repository.interface";
import { ITicketRepository } from "../../src/domain/interfaces/ticket-repository.interface";
import { IEventRepository } from "../../src/domain/interfaces/event-repository.interface";
import { Reservation } from "../../src/domain/entities/reservation.entity";
import { Event } from "../../src/domain/entities/event.entity";
import { TicketConfiguration } from "../../src/domain/entities/ticket-configuration.entity";
import { TicketType } from "../../src/domain/value-objects/ticket-type.vo";
import { Money } from "../../src/domain/value-objects/money.vo";
import { Email } from "../../src/domain/value-objects/email.vo";
import { TicketQuantity } from "../../src/domain/value-objects/ticket-quantity.vo";
import {
  moneyArbitrary,
  ticketTypeArbitrary,
  ticketQuantityVOArbitrary,
  emailVOArbitrary,
} from "./generators/payment.generator";

/**
 * Feature: ticket-sales-system
 * Property 3: Successful Payment State Transitions
 * Validates: Requirements 4.2, 4.3, 4.4, 4.5, 5.1, 5.2
 *
 * *For any* valid reservation and successful payment, the system should:
 * - Change reservation state from ACTIVE to CONFIRMED
 * - Generate tickets equal to the quantity
 * - Persist tickets with correct data
 * - Update reservation in repository
 */
describe("Property 3: Successful Payment State Transitions", () => {
  const PROPERTY_CONFIG: fc.Parameters<unknown> = {
    numRuns: 100,
    verbose: fc.VerbosityLevel.VeryVerbose,
  };

  let useCase: ProcessPaymentUseCase;
  let mockPaymentGateway: jest.Mocked<IPaymentGateway>;
  let mockReservationRepository: jest.Mocked<IReservationRepository>;
  let mockTicketRepository: jest.Mocked<ITicketRepository>;
  let mockEventRepository: jest.Mocked<IEventRepository>;

  beforeEach(() => {
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

  describe("Successful payment always confirms reservation", () => {
    it("should transition reservation from ACTIVE to CONFIRMED for any valid payment", async () => {
      await fc.assert(
        fc.asyncProperty(
          moneyArbitrary,
          ticketTypeArbitrary,
          ticketQuantityVOArbitrary,
          emailVOArbitrary,
          async (totalAmount, ticketType, quantity, buyerEmail) => {
            // Arrange
            const reservationId = fc.sample(fc.uuid(), 1)[0] as string;
            const eventId = fc.sample(fc.uuid(), 1)[0] as string;

            const reservation = new Reservation(
              reservationId,
              eventId,
              ticketType,
              quantity,
              buyerEmail,
              totalAmount,
              new Date(Date.now() + 15 * 60 * 1000),
            );

            const event = new Event(
              eventId,
              "Test Event",
              new Date("2025-03-15T20:00:00Z"),
              "Test Location",
              [
                new TicketConfiguration(
                  ticketType,
                  totalAmount.multiply(1 / quantity.value),
                  100,
                  100 - quantity.value,
                ),
              ],
            );

            const successResult: PaymentResult = {
              success: true,
              transactionId: fc.sample(
                fc.hexaString({ minLength: 10 }),
                1,
              )[0] as string,
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
            expect(reservation.status).toBe("CONFIRMED");
            expect(mockReservationRepository.update).toHaveBeenCalledWith(
              reservation,
            );
          },
        ),
        PROPERTY_CONFIG,
      );
    });
  });

  describe("Successful payment always generates correct number of tickets", () => {
    it("should generate tickets equal to reservation quantity for any valid payment", async () => {
      await fc.assert(
        fc.asyncProperty(
          moneyArbitrary,
          ticketTypeArbitrary,
          ticketQuantityVOArbitrary,
          emailVOArbitrary,
          async (totalAmount, ticketType, quantity, buyerEmail) => {
            // Reset mocks for each iteration
            jest.clearAllMocks();

            // Arrange
            const reservationId = fc.sample(fc.uuid(), 1)[0] as string;
            const eventId = fc.sample(fc.uuid(), 1)[0] as string;

            const reservation = new Reservation(
              reservationId,
              eventId,
              ticketType,
              quantity,
              buyerEmail,
              totalAmount,
              new Date(Date.now() + 15 * 60 * 1000),
            );

            const event = new Event(
              eventId,
              "Test Event",
              new Date("2025-03-15T20:00:00Z"),
              "Test Location",
              [
                new TicketConfiguration(
                  ticketType,
                  totalAmount.multiply(1 / quantity.value),
                  100,
                  100 - quantity.value,
                ),
              ],
            );

            const successResult: PaymentResult = {
              success: true,
              transactionId: fc.sample(
                fc.hexaString({ minLength: 10 }),
                1,
              )[0] as string,
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
            await useCase.execute(input);

            // Assert
            const savedTickets = (mockTicketRepository.saveMany as jest.Mock)
              .mock.calls[0][0];
            expect(savedTickets).toHaveLength(quantity.value);

            // All tickets should have correct type and buyer email
            savedTickets.forEach((ticket: any) => {
              expect(ticket.type).toBe(ticketType);
              expect(ticket.buyerEmail.value).toBe(buyerEmail.value);
            });
          },
        ),
        PROPERTY_CONFIG,
      );
    });
  });
});

/**
 * Feature: ticket-sales-system
 * Property 4: Failed Payment Triggers Ticket Release
 * Validates: Requirements 4.5, 5.1, 5.2
 *
 * *For any* valid reservation and failed payment, the system should:
 * - Change reservation state from ACTIVE to CANCELLED
 * - Release tickets back to event availability
 * - Increment event availability by reservation quantity
 * - NOT generate any tickets
 */
describe("Property 4: Failed Payment Triggers Ticket Release", () => {
  const PROPERTY_CONFIG: fc.Parameters<unknown> = {
    numRuns: 100,
    verbose: fc.VerbosityLevel.VeryVerbose,
  };

  let useCase: ProcessPaymentUseCase;
  let mockPaymentGateway: jest.Mocked<IPaymentGateway>;
  let mockReservationRepository: jest.Mocked<IReservationRepository>;
  let mockTicketRepository: jest.Mocked<ITicketRepository>;
  let mockEventRepository: jest.Mocked<IEventRepository>;

  beforeEach(() => {
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

  describe("Failed payment always cancels reservation", () => {
    it("should transition reservation from ACTIVE to CANCELLED for any failed payment", async () => {
      await fc.assert(
        fc.asyncProperty(
          moneyArbitrary,
          ticketTypeArbitrary,
          ticketQuantityVOArbitrary,
          emailVOArbitrary,
          async (totalAmount, ticketType, quantity, buyerEmail) => {
            // Arrange
            const reservationId = fc.sample(fc.uuid(), 1)[0] as string;
            const eventId = fc.sample(fc.uuid(), 1)[0] as string;

            const reservation = new Reservation(
              reservationId,
              eventId,
              ticketType,
              quantity,
              buyerEmail,
              totalAmount,
              new Date(Date.now() + 15 * 60 * 1000),
            );

            const event = new Event(
              eventId,
              "Test Event",
              new Date("2025-03-15T20:00:00Z"),
              "Test Location",
              [
                new TicketConfiguration(
                  ticketType,
                  totalAmount.multiply(1 / quantity.value),
                  100,
                  100 - quantity.value,
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
            expect(reservation.status).toBe("CANCELLED");
            expect(mockReservationRepository.update).toHaveBeenCalledWith(
              reservation,
            );
          },
        ),
        PROPERTY_CONFIG,
      );
    });
  });

  describe("Failed payment always releases tickets", () => {
    it("should release tickets and increment availability for any failed payment", async () => {
      await fc.assert(
        fc.asyncProperty(
          moneyArbitrary,
          ticketTypeArbitrary,
          ticketQuantityVOArbitrary,
          emailVOArbitrary,
          async (totalAmount, ticketType, quantity, buyerEmail) => {
            // Arrange
            const reservationId = fc.sample(fc.uuid(), 1)[0] as string;
            const eventId = fc.sample(fc.uuid(), 1)[0] as string;
            const initialAvailability = 100 - quantity.value;

            const reservation = new Reservation(
              reservationId,
              eventId,
              ticketType,
              quantity,
              buyerEmail,
              totalAmount,
              new Date(Date.now() + 15 * 60 * 1000),
            );

            const event = new Event(
              eventId,
              "Test Event",
              new Date("2025-03-15T20:00:00Z"),
              "Test Location",
              [
                new TicketConfiguration(
                  ticketType,
                  totalAmount.multiply(1 / quantity.value),
                  100,
                  initialAvailability,
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
            await useCase.execute(input);

            // Assert
            const finalAvailability = event.getAvailability(ticketType);
            expect(finalAvailability).toBe(100); // Should be back to full capacity
            expect(mockEventRepository.update).toHaveBeenCalledWith(event);
            expect(mockTicketRepository.saveMany).not.toHaveBeenCalled();
          },
        ),
        PROPERTY_CONFIG,
      );
    });
  });
});
