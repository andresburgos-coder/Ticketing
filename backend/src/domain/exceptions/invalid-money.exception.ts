/**
 * Exception thrown when an invalid Money value is attempted to be created.
 * This includes negative amounts or invalid currency codes.
 */
export class InvalidMoneyException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMoneyException';
  }
}
