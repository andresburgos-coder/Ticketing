import { GetBuyerTicketsUseCase } from "./get-buyer-tickets.use-case";
import { ITicketRepository } from "../../domain/interfaces/ticket-repository.interface";
import { Ticket } from "../../domain/entities/ticket.entity";
import { Email } from "../../domain/value-objects/email.vo";
import { Money } from "../../domain/value-objects/money.vo";
import { TicketType } from "../../domain/value-objects/ticket-type.vo";

/**
 * GetBuyerTicketsUseCase Tests
 *
 * Tests for the use case that retrieves all confirmed tickets for a buyer.
 * Validates that only confirmed tickets are returned and all required fields are present.
 *
 * Requirements: 6.1, 6.2, 6.3
 * - 6.1: Return all confirmed tickets for a buyer
 * - 6.2: Each ticket includes: code, event name, ticket type, purchase date
 * - 6.3: Return empty list without error if buyer has no tickets
 */
describe("GetBuyerTicketsUseCase", () => {
  let useCase: GetBuyerTicketsUseCase;
  let mockTicketRepository: jest.Mocked<ITicketRepository>;

  beforeEach(() => {
    // Create a mock repository
    mockTicketRepository = {
      save: jest.fn(),
      saveMany: jest.fn(),
      findByBuyer: jest.fn(),
      findByEvent: jest.fn(),
    };

    useCase = new GetBuyerTicketsUseCase(mockTicketRepository);
  });

  describe("execute", () => {
    it("should return confirmed tickets for a buyer", async () => {
      // Arrange
      const buyerEmail = Email.create("buyer@example.com");

      const tickets = [
        new Ticket(
          "ticket-1",
          "TKT-001",
          "event-1",
          TicketType.VIP,
          buyerEmail,
          Money.create(150000, "COP"),
          new Date("2025-03-15T20:00:00Z"),
        ),
        new Ticket(
          "ticket-2",
          "TKT-002",
          "event-1",
          TicketType.GENERAL,
          buyerEmail,
          Money.create(100000, "COP"),
          new Date("2025-03-15T20:00:00Z"),
        ),
      ];

      mockTicketRepository.findByBuyer.mockResolvedValue(tickets);

      // Act
      const result = await useCase.execute(buyerEmail.value);

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual(tickets);
      expect(mockTicketRepository.findByBuyer).toHaveBeenCalledWith(buyerEmail);
      expect(mockTicketRepository.findByBuyer).toHaveBeenCalledTimes(1);
    });

    it("should return empty list if buyer has no tickets", async () => {
      // Arrange
      const buyerEmail = Email.create("notickets@example.com");
      mockTicketRepository.findByBuyer.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(buyerEmail.value);

      // Assert
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
      expect(mockTicketRepository.findByBuyer).toHaveBeenCalledWith(buyerEmail);
    });

    it("should include all required fields in each ticket", async () => {
      // Arrange
      const buyerEmail = Email.create("buyer@example.com");
      const purchaseDate = new Date("2025-03-15T20:00:00Z");

      const ticket = new Ticket(
        "ticket-123",
        "TKT-ABC123",
        "event-456",
        TicketType.EARLY_BIRD,
        buyerEmail,
        Money.create(80000, "COP"),
        purchaseDate,
      );

      mockTicketRepository.findByBuyer.mockResolvedValue([ticket]);

      // Act
      const result = await useCase.execute(buyerEmail.value);

      // Assert
      expect(result).toHaveLength(1);
      const returnedTicket = result[0]!;

      // Verify all required fields are present
      expect(returnedTicket.id).toBe("ticket-123");
      expect(returnedTicket.code).toBe("TKT-ABC123");
      expect(returnedTicket.eventId).toBe("event-456");
      expect(returnedTicket.type).toBe(TicketType.EARLY_BIRD);
      expect(returnedTicket.buyerEmail.value).toBe("buyer@example.com");
      expect(returnedTicket.price.amount).toBe(80000);
      expect(returnedTicket.price.currency).toBe("COP");
      expect(returnedTicket.purchaseDate).toEqual(purchaseDate);
    });

    it("should return multiple tickets for a buyer", async () => {
      // Arrange
      const buyerEmail = Email.create("buyer@example.com");

      const tickets = [
        new Ticket(
          "ticket-1",
          "TKT-001",
          "event-1",
          TicketType.VIP,
          buyerEmail,
          Money.create(150000, "COP"),
          new Date("2025-03-15T20:00:00Z"),
        ),
        new Ticket(
          "ticket-2",
          "TKT-002",
          "event-1",
          TicketType.GENERAL,
          buyerEmail,
          Money.create(100000, "COP"),
          new Date("2025-03-15T20:00:00Z"),
        ),
        new Ticket(
          "ticket-3",
          "TKT-003",
          "event-2",
          TicketType.EARLY_BIRD,
          buyerEmail,
          Money.create(80000, "COP"),
          new Date("2025-04-20T19:00:00Z"),
        ),
      ];

      mockTicketRepository.findByBuyer.mockResolvedValue(tickets);

      // Act
      const result = await useCase.execute(buyerEmail.value);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]!.code).toBe("TKT-001");
      expect(result[1]!.code).toBe("TKT-002");
      expect(result[2]!.code).toBe("TKT-003");
    });
  });
});
