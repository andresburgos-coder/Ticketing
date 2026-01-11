import { InvalidQuantityException } from "../exceptions/invalid-quantity.exception";

/**
 * TicketQuantity Value Object - Immutable representation of ticket quantities.
 * Follows the Value Object pattern with validation on creation.
 * Valid range is [1, 10] tickets per reservation.
 *
 * @example
 * const quantity = TicketQuantity.create(5);
 * const isEqual = quantity.equals(TicketQuantity.create(5)); // true
 */
export class TicketQuantity {
  private static readonly MIN_QUANTITY = 1;
  private static readonly MAX_QUANTITY = 10;

  private constructor(public readonly value: number) {}

  /**
   * Factory method to create a TicketQuantity instance with validation.
   * @param value - The quantity value (must be integer between 1 and 10)
   * @throws InvalidQuantityException if value is not an integer or outside valid range
   */
  static create(value: number): TicketQuantity {
    if (!Number.isInteger(value)) {
      throw new InvalidQuantityException("Quantity must be an integer");
    }
    if (
      value < TicketQuantity.MIN_QUANTITY ||
      value > TicketQuantity.MAX_QUANTITY
    ) {
      throw new InvalidQuantityException(
        `Quantity must be between ${TicketQuantity.MIN_QUANTITY} and ${TicketQuantity.MAX_QUANTITY}`,
      );
    }
    return new TicketQuantity(value);
  }

  /**
   * Checks equality with another TicketQuantity value.
   * @param other - The TicketQuantity to compare
   * @returns true if both values are equal
   */
  equals(other: TicketQuantity): boolean {
    return this.value === other.value;
  }
}
