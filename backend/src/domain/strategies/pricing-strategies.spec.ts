import { Money } from "../value-objects/money.vo";
import { TicketType } from "../value-objects/ticket-type.vo";
import { VipPricingStrategy } from "./vip-pricing.strategy";
import { GeneralPricingStrategy } from "./general-pricing.strategy";
import { EarlyBirdPricingStrategy } from "./early-bird-pricing.strategy";

describe("Pricing Strategies", () => {
  describe("VipPricingStrategy", () => {
    let strategy: VipPricingStrategy;

    beforeEach(() => {
      strategy = new VipPricingStrategy();
    });

    it("should have VIP ticket type", () => {
      expect(strategy.ticketType).toBe(TicketType.VIP);
    });

    it("should calculate price with 1.5x multiplier", () => {
      // Arrange
      const basePrice = Money.create(100, "COP");
      const quantity = 2;
      const expectedAmount = 100 * 2 * 1.5; // 300

      // Act
      const result = strategy.calculatePrice(basePrice, quantity);

      // Assert
      expect(result.amount).toBe(expectedAmount);
      expect(result.currency).toBe("COP");
    });

    it("should calculate price correctly for single ticket", () => {
      // Arrange
      const basePrice = Money.create(50000, "COP");
      const quantity = 1;
      const expectedAmount = 50000 * 1.5; // 75000

      // Act
      const result = strategy.calculatePrice(basePrice, quantity);

      // Assert
      expect(result.amount).toBe(expectedAmount);
      expect(result.currency).toBe("COP");
    });

    it("should calculate price correctly for multiple tickets", () => {
      // Arrange
      const basePrice = Money.create(25000, "COP");
      const quantity = 5;
      const expectedAmount = 25000 * 5 * 1.5; // 187500

      // Act
      const result = strategy.calculatePrice(basePrice, quantity);

      // Assert
      expect(result.amount).toBe(expectedAmount);
      expect(result.currency).toBe("COP");
    });
  });

  describe("GeneralPricingStrategy", () => {
    let strategy: GeneralPricingStrategy;

    beforeEach(() => {
      strategy = new GeneralPricingStrategy();
    });

    it("should have GENERAL ticket type", () => {
      expect(strategy.ticketType).toBe(TicketType.GENERAL);
    });

    it("should calculate price with 1.0x multiplier", () => {
      // Arrange
      const basePrice = Money.create(100, "COP");
      const quantity = 2;
      const expectedAmount = 100 * 2 * 1.0; // 200

      // Act
      const result = strategy.calculatePrice(basePrice, quantity);

      // Assert
      expect(result.amount).toBe(expectedAmount);
      expect(result.currency).toBe("COP");
    });

    it("should calculate price correctly for single ticket", () => {
      // Arrange
      const basePrice = Money.create(30000, "COP");
      const quantity = 1;
      const expectedAmount = 30000 * 1.0; // 30000

      // Act
      const result = strategy.calculatePrice(basePrice, quantity);

      // Assert
      expect(result.amount).toBe(expectedAmount);
      expect(result.currency).toBe("COP");
    });

    it("should calculate price correctly for multiple tickets", () => {
      // Arrange
      const basePrice = Money.create(20000, "COP");
      const quantity = 3;
      const expectedAmount = 20000 * 3 * 1.0; // 60000

      // Act
      const result = strategy.calculatePrice(basePrice, quantity);

      // Assert
      expect(result.amount).toBe(expectedAmount);
      expect(result.currency).toBe("COP");
    });
  });

  describe("EarlyBirdPricingStrategy", () => {
    let strategy: EarlyBirdPricingStrategy;

    beforeEach(() => {
      strategy = new EarlyBirdPricingStrategy();
    });

    it("should have EARLY_BIRD ticket type", () => {
      expect(strategy.ticketType).toBe(TicketType.EARLY_BIRD);
    });

    it("should calculate price with 0.8x multiplier", () => {
      // Arrange
      const basePrice = Money.create(100, "COP");
      const quantity = 2;
      const expectedAmount = 100 * 2 * 0.8; // 160

      // Act
      const result = strategy.calculatePrice(basePrice, quantity);

      // Assert
      expect(result.amount).toBe(expectedAmount);
      expect(result.currency).toBe("COP");
    });

    it("should calculate price correctly for single ticket", () => {
      // Arrange
      const basePrice = Money.create(40000, "COP");
      const quantity = 1;
      const expectedAmount = 40000 * 0.8; // 32000

      // Act
      const result = strategy.calculatePrice(basePrice, quantity);

      // Assert
      expect(result.amount).toBe(expectedAmount);
      expect(result.currency).toBe("COP");
    });

    it("should calculate price correctly for multiple tickets", () => {
      // Arrange
      const basePrice = Money.create(15000, "COP");
      const quantity = 4;
      const expectedAmount = 15000 * 4 * 0.8; // 48000

      // Act
      const result = strategy.calculatePrice(basePrice, quantity);

      // Assert
      expect(result.amount).toBe(expectedAmount);
      expect(result.currency).toBe("COP");
    });
  });
});
