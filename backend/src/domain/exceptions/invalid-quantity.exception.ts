/**
 * Exception thrown when an invalid TicketQuantity value is attempted to be created.
 * This includes quantities outside the valid range [1, 10] or non-integer values.
 */
export class InvalidQuantityException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidQuantityException";
  }
}
