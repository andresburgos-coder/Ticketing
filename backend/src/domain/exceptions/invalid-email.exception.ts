/**
 * Exception thrown when an invalid Email value is attempted to be created.
 * This includes invalid email formats or empty values.
 */
export class InvalidEmailException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidEmailException";
  }
}
