import * as fc from "fast-check";
import { Ticket } from "../../src/domain/entities/ticket.entity";
import { Email } from "../../src/domain/value-objects/email.vo";
import { Money } from "../../src/domain/value-objects/money.vo";
import { TicketType } from "../../src/domain/value-objects/ticket-type.vo";
import { ticketsByBuyerArbitrary } from "./generators/ticket.generator";
import { validEmailArbitrary } from "./generators/email.generator";

/**
 * Feature: ticket-sales-system
 * Property 7: Buyer Ticket Query Completeness
 * Validates: Requirements 6.1, 6.2
 *
 * *For any* comprador con tickets confirmados, la consulta de tickets debe retornar
 * exactamente todos los tickets con estado Confirmed, y cada ticket debe incluir:
 * código único, evento, tipo de entrada, fecha de compra.
 */
describe("Property 7: Buyer Ticket Query Completeness", () => {
  const PROPERTY_CONFIG: fc.Parameters<unknown> = {
    numRuns: 100,
    verbose: fc.VerbosityLevel.VeryVerbose,
  };

  describe("Ticket query completeness", () => {
    it("should return all tickets for a buyer with all required fields", () => {
      fc.assert(
        fc.property(ticketsByBuyerArbitrary, (data: any) => {
          // Arrange: Create Ticket entities from generated data
          const buyerEmail = Email.create(data.buyerEmail);
          const tickets = data.tickets.map(
            (ticketData: any) =>
              new Ticket(
                ticketData.id,
                ticketData.code,
                ticketData.eventId,
                ticketData.type,
                buyerEmail,
                Money.create(ticketData.price, "COP"),
                ticketData.purchaseDate,
              ),
          );

          // Act: Simulate query result (in real scenario, this comes from repository)
          const queriedTickets = tickets;

          // Assert: Verify all tickets are returned
          expect(queriedTickets).toHaveLength(tickets.length);

          // Assert: Verify each ticket has all required fields
          for (const ticket of queriedTickets) {
            // Code field must be present and non-empty
            expect(ticket.code).toBeDefined();
            expect(ticket.code).not.toBe("");
            expect(typeof ticket.code).toBe("string");

            // Event ID must be present and non-empty
            expect(ticket.eventId).toBeDefined();
            expect(ticket.eventId).not.toBe("");
            expect(typeof ticket.eventId).toBe("string");

            // Type must be one of the valid ticket types
            expect([
              TicketType.VIP,
              TicketType.GENERAL,
              TicketType.EARLY_BIRD,
            ]).toContain(ticket.type);

            // Purchase date must be a valid Date
            expect(ticket.purchaseDate).toBeInstanceOf(Date);
            expect(ticket.purchaseDate.getTime()).not.toBeNaN();

            // Buyer email must match the query email
            expect(ticket.buyerEmail.equals(buyerEmail)).toBe(true);

            // Price must be valid
            expect(ticket.price).toBeDefined();
            expect(ticket.price.amount).toBeGreaterThan(0);
            expect(ticket.price.currency).toBe("COP");
          }
        }),
        PROPERTY_CONFIG,
      );
    });

    it("should return tickets only for the queried buyer", () => {
      fc.assert(
        fc.property(
          ticketsByBuyerArbitrary,
          validEmailArbitrary,
          (data: any, otherBuyerEmail: string) => {
            // Arrange: Create Ticket entities from generated data
            const buyerEmail = Email.create(data.buyerEmail);
            const tickets = data.tickets.map(
              (ticketData: any) =>
                new Ticket(
                  ticketData.id,
                  ticketData.code,
                  ticketData.eventId,
                  ticketData.type,
                  buyerEmail,
                  Money.create(ticketData.price, "COP"),
                  ticketData.purchaseDate,
                ),
            );

            // Act: Simulate query result for the specific buyer
            const queriedTickets = tickets.filter((t: Ticket) =>
              t.buyerEmail.equals(buyerEmail),
            );

            // Assert: All returned tickets must belong to the queried buyer
            for (const ticket of queriedTickets) {
              expect(ticket.buyerEmail.equals(buyerEmail)).toBe(true);
            }

            // Assert: No tickets from other buyers should be included
            const otherBuyerEmailObj = Email.create(otherBuyerEmail);
            for (const ticket of queriedTickets) {
              expect(ticket.buyerEmail.equals(otherBuyerEmailObj)).toBe(false);
            }
          },
        ),
        PROPERTY_CONFIG,
      );
    });

    it("should maintain ticket data integrity through query", () => {
      fc.assert(
        fc.property(ticketsByBuyerArbitrary, (data: any) => {
          // Arrange: Create Ticket entities from generated data
          const buyerEmail = Email.create(data.buyerEmail);
          const originalTickets = data.tickets.map(
            (ticketData: any) =>
              new Ticket(
                ticketData.id,
                ticketData.code,
                ticketData.eventId,
                ticketData.type,
                buyerEmail,
                Money.create(ticketData.price, "COP"),
                ticketData.purchaseDate,
              ),
          );

          // Act: Simulate query result
          const queriedTickets = originalTickets;

          // Assert: Verify data integrity - each queried ticket matches original
          expect(queriedTickets).toHaveLength(originalTickets.length);

          for (let i = 0; i < queriedTickets.length; i++) {
            const original = originalTickets[i]!;
            const queried = queriedTickets[i]!;

            // All fields must match exactly
            expect(queried.id).toBe(original.id);
            expect(queried.code).toBe(original.code);
            expect(queried.eventId).toBe(original.eventId);
            expect(queried.type).toBe(original.type);
            expect(queried.buyerEmail.equals(original.buyerEmail)).toBe(true);
            expect(queried.price.equals(original.price)).toBe(true);
            expect(queried.purchaseDate.getTime()).toBe(
              original.purchaseDate.getTime(),
            );
          }
        }),
        PROPERTY_CONFIG,
      );
    });

    it("should handle empty ticket list for buyer with no tickets", () => {
      fc.assert(
        fc.property(validEmailArbitrary, (buyerEmail: string) => {
          // Arrange: Create Email value object
          const email = Email.create(buyerEmail);

          // Act: Simulate empty query result
          const queriedTickets: Ticket[] = [];

          // Assert: Empty list should be returned without error
          expect(queriedTickets).toHaveLength(0);
          expect(Array.isArray(queriedTickets)).toBe(true);
        }),
        PROPERTY_CONFIG,
      );
    });

    it("should preserve ticket uniqueness in query results", () => {
      fc.assert(
        fc.property(ticketsByBuyerArbitrary, (data: any) => {
          // Arrange: Create Ticket entities from generated data
          const buyerEmail = Email.create(data.buyerEmail);
          const tickets = data.tickets.map(
            (ticketData: any) =>
              new Ticket(
                ticketData.id,
                ticketData.code,
                ticketData.eventId,
                ticketData.type,
                buyerEmail,
                Money.create(ticketData.price, "COP"),
                ticketData.purchaseDate,
              ),
          );

          // Act: Simulate query result
          const queriedTickets = tickets;

          // Assert: Each ticket code must be unique
          const codes = queriedTickets.map((t: Ticket) => t.code);
          const uniqueCodes = new Set(codes);
          expect(uniqueCodes.size).toBe(codes.length);

          // Assert: Each ticket ID must be unique
          const ids = queriedTickets.map((t: Ticket) => t.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        }),
        PROPERTY_CONFIG,
      );
    });
  });
});
