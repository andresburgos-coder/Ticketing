import { PricingService } from "./pricing.service";
import { Money } from "../../domain/value-objects/money.vo";
import { TicketType } from "../../domain/value-objects/ticket-type.vo";

describe("PricingService", () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
  });

  describe("calculatePrice", () => {
    it("should use VIP strategy for VIP ticket type", () => {
      // Arrange
      const basePrice = Money.create(100, "COP");
      const quantity = 2;
      const expectedAmount = 100 * 2 * 1.5; // 300 (VIP multiplier is 1.5)

      // Act
      const result = service.calculatePrice(
        TicketType.VIP,
        basePrice,
        quantity,
      );

      // Assert
      expect(result.amount).toBe(expectedAmount);
      expect(result.currency).toBe("COP");
    });

    it("should use GENERAL strategy for GENERAL ticket type", () => {
      // Arrange
      const basePrice = Money.create(100, "COP");
      const quantity = 2;
      const expectedAmount = 100 * 2 * 1.0; // 200 (GENERAL multiplier is 1.0)

      // Act
      const result = service.calculatePrice(
        TicketType.GENERAL,
        basePrice,
        quantity,
      );

      // Assert
      expect(result.amount).toBe(expectedAmount);
      expect(result.currency).toBe("COP");
    });

    it("should use EARLY_BIRD strategy for EARLY_BIRD ticket type", () => {
      // Arrange
      const basePrice = Money.create(100, "COP");
      const quantity = 2;
      const expectedAmount = 100 * 2 * 0.8; // 160 (EARLY_BIRD multiplier is 0.8)

      // Act
      const result = service.calculatePrice(
        TicketType.EARLY_BIRD,
        basePrice,
        quantity,
      );

      // Assert
      expect(result.amount).toBe(expectedAmount);
      expect(result.currency).toBe("COP");
    });

    it("should throw error if ticket type has no strategy", () => {
      // Arrange
      const basePrice = Money.create(100, "COP");
      const quantity = 2;
      const invalidType = "INVALID_TYPE" as unknown as TicketType;

      // Act & Assert
      expect(() => {
        service.calculatePrice(invalidType, basePrice, quantity);
      }).toThrow("No pricing strategy found for ticket type");
    });
  });
});
