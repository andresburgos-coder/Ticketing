import { InvalidMoneyException } from '../exceptions/invalid-money.exception';

/**
 * Money Value Object - Immutable representation of monetary values.
 * Follows the Value Object pattern with validation on creation.
 * Default currency is COP (Colombian Peso).
 *
 * @example
 * const price = Money.create(50000, 'COP');
 * const total = price.multiply(2); // 100000 COP
 */
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {}

  /**
   * Factory method to create a Money instance with validation.
   * @param amount - The monetary amount (must be non-negative)
   * @param currency - The 3-letter currency code (e.g., 'COP', 'USD', 'EUR')
   * @throws InvalidMoneyException if amount is negative or currency is invalid
   */
  static create(amount: number, currency: string = 'COP'): Money {
    if (amount < 0) {
      throw new InvalidMoneyException('Amount cannot be negative');
    }
    if (!currency || currency.length !== 3) {
      throw new InvalidMoneyException('Currency must be a 3-letter code');
    }
    return new Money(amount, currency.toUpperCase());
  }

  /**
   * Adds another Money value to this one.
   * Both must have the same currency.
   * @param other - The Money to add
   * @returns A new Money instance with the sum
   * @throws InvalidMoneyException if currencies don't match
   */
  add(other: Money): Money {
    this.validateSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  /**
   * Multiplies this Money by a factor.
   * @param factor - The multiplication factor
   * @returns A new Money instance with the product
   */
  multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }

  /**
   * Checks equality with another Money value.
   * @param other - The Money to compare
   * @returns true if both amount and currency are equal
   */
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private validateSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new InvalidMoneyException(
        `Cannot operate on different currencies: ${this.currency} vs ${other.currency}`,
      );
    }
  }
}
