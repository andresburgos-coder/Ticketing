import { TicketConfiguration } from "./ticket-configuration.entity";
import { TicketType } from "../value-objects/ticket-type.vo";
import { Money } from "../value-objects/money.vo";
import { InsufficientTicketsException } from "../exceptions/insufficient-tickets.exception";

describe("TicketConfiguration Entity", () => {
  describe("constructor", () => {
    it("should create TicketConfiguration with valid data", () => {
      const price = Money.create(150000, "COP");
      const config = new TicketConfiguration(TicketType.VIP, price, 100, 75);

      expect(config.type).toBe(TicketType.VIP);
      expect(config.price).toBe(price);
      expect(config.totalQuantity).toBe(100);
      expect(config.availableQuantity).toBe(75);
    });
  });

  describe("decrementAvailability", () => {
    it("should decrement availability correctly", () => {
      const config = new TicketConfiguration(
        TicketType.VIP,
        Money.create(150000, "COP"),
        100,
        75,
      );

      config.decrementAvailability(10);

      expect(config.availableQuantity).toBe(65);
    });

    it("should throw InsufficientTicketsException when not enough available", () => {
      const config = new TicketConfiguration(
        TicketType.VIP,
        Money.create(150000, "COP"),
        100,
        5,
      );

      expect(() => config.decrementAvailability(10)).toThrow(
        InsufficientTicketsException,
      );
      expect(() => config.decrementAvailability(10)).toThrow(
        "Requested 10 VIP tickets but only 5 available",
      );
    });

    it("should allow decrementing exact available amount", () => {
      const config = new TicketConfiguration(
        TicketType.VIP,
        Money.create(150000, "COP"),
        100,
        5,
      );

      config.decrementAvailability(5);

      expect(config.availableQuantity).toBe(0);
    });
  });

  describe("incrementAvailability", () => {
    it("should increment availability correctly", () => {
      const config = new TicketConfiguration(
        TicketType.VIP,
        Money.create(150000, "COP"),
        100,
        70,
      );

      config.incrementAvailability(5);

      expect(config.availableQuantity).toBe(75);
    });

    it("should not exceed total quantity when incrementing", () => {
      const config = new TicketConfiguration(
        TicketType.VIP,
        Money.create(150000, "COP"),
        100,
        95,
      );

      config.incrementAvailability(10);

      expect(config.availableQuantity).toBe(100); // Should cap at totalQuantity
    });

    it("should handle increment that exactly reaches total quantity", () => {
      const config = new TicketConfiguration(
        TicketType.VIP,
        Money.create(150000, "COP"),
        100,
        95,
      );

      config.incrementAvailability(5);

      expect(config.availableQuantity).toBe(100);
    });
  });
});
