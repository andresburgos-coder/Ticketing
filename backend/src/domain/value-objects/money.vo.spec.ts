import { Money } from "./money.vo";
import { InvalidMoneyException } from "../exceptions/invalid-money.exception";

describe("Money Value Object", () => {
  describe("create", () => {
    it("should create Money with valid positive amount", () => {
      const money = Money.create(50000, "COP");

      expect(money.amount).toBe(50000);
      expect(money.currency).toBe("COP");
    });

    it("should create Money with zero amount", () => {
      const money = Money.create(0, "COP");

      expect(money.amount).toBe(0);
      expect(money.currency).toBe("COP");
    });

    it("should create Money with decimal amount", () => {
      const money = Money.create(99.99, "EUR");

      expect(money.amount).toBe(99.99);
      expect(money.currency).toBe("EUR");
    });

    it("should use COP as default currency", () => {
      const money = Money.create(50000);

      expect(money.currency).toBe("COP");
    });

    it("should normalize currency to uppercase", () => {
      const money = Money.create(50000, "cop");

      expect(money.currency).toBe("COP");
    });

    it("should throw InvalidMoneyException for negative amount", () => {
      expect(() => Money.create(-10, "COP")).toThrow(InvalidMoneyException);
      expect(() => Money.create(-10, "COP")).toThrow(
        "Amount cannot be negative",
      );
    });

    it("should throw InvalidMoneyException for invalid currency code (too short)", () => {
      expect(() => Money.create(50000, "CO")).toThrow(InvalidMoneyException);
      expect(() => Money.create(50000, "CO")).toThrow(
        "Currency must be a 3-letter code",
      );
    });

    it("should throw InvalidMoneyException for invalid currency code (too long)", () => {
      expect(() => Money.create(50000, "COPP")).toThrow(InvalidMoneyException);
    });

    it("should throw InvalidMoneyException for empty currency", () => {
      expect(() => Money.create(50000, "")).toThrow(InvalidMoneyException);
    });
  });

  describe("add", () => {
    it("should add two Money objects with same currency", () => {
      const money1 = Money.create(50000, "COP");
      const money2 = Money.create(25000, "COP");

      const result = money1.add(money2);

      expect(result.amount).toBe(75000);
      expect(result.currency).toBe("COP");
    });

    it("should add Money with zero amount", () => {
      const money1 = Money.create(50000, "COP");
      const money2 = Money.create(0, "COP");

      const result = money1.add(money2);

      expect(result.amount).toBe(50000);
    });

    it("should throw InvalidMoneyException when adding different currencies", () => {
      const money1 = Money.create(50000, "COP");
      const money2 = Money.create(50, "EUR");

      expect(() => money1.add(money2)).toThrow(InvalidMoneyException);
      expect(() => money1.add(money2)).toThrow(
        "Cannot operate on different currencies: COP vs EUR",
      );
    });

    it("should return a new Money instance (immutability)", () => {
      const money1 = Money.create(50000, "COP");
      const money2 = Money.create(25000, "COP");

      const result = money1.add(money2);

      expect(result).not.toBe(money1);
      expect(result).not.toBe(money2);
      expect(money1.amount).toBe(50000); // Original unchanged
    });
  });

  describe("multiply", () => {
    it("should multiply Money by a positive factor", () => {
      const money = Money.create(50000, "COP");

      const result = money.multiply(1.5);

      expect(result.amount).toBe(75000);
      expect(result.currency).toBe("COP");
    });

    it("should multiply Money by zero", () => {
      const money = Money.create(50000, "COP");

      const result = money.multiply(0);

      expect(result.amount).toBe(0);
    });

    it("should multiply Money by integer", () => {
      const money = Money.create(25000, "COP");

      const result = money.multiply(4);

      expect(result.amount).toBe(100000);
    });

    it("should multiply Money by decimal factor", () => {
      const money = Money.create(100000, "COP");

      const result = money.multiply(0.8);

      expect(result.amount).toBeCloseTo(80000, 2);
    });

    it("should return a new Money instance (immutability)", () => {
      const money = Money.create(50000, "COP");

      const result = money.multiply(2);

      expect(result).not.toBe(money);
      expect(money.amount).toBe(50000); // Original unchanged
    });
  });

  describe("equals", () => {
    it("should return true for Money with same amount and currency", () => {
      const money1 = Money.create(50000, "COP");
      const money2 = Money.create(50000, "COP");

      expect(money1.equals(money2)).toBe(true);
    });

    it("should return false for Money with different amounts", () => {
      const money1 = Money.create(50000, "COP");
      const money2 = Money.create(25000, "COP");

      expect(money1.equals(money2)).toBe(false);
    });

    it("should return false for Money with different currencies", () => {
      const money1 = Money.create(50000, "COP");
      const money2 = Money.create(50000, "EUR");

      expect(money1.equals(money2)).toBe(false);
    });

    it("should return false for Money with different amount and currency", () => {
      const money1 = Money.create(50000, "COP");
      const money2 = Money.create(50, "EUR");

      expect(money1.equals(money2)).toBe(false);
    });
  });
});
