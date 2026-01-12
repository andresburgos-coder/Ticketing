import { InvalidEmailException } from "../exceptions/invalid-email.exception";

/**
 * Email Value Object - Immutable representation of email addresses.
 * Follows the Value Object pattern with validation on creation.
 * Normalizes emails to lowercase and trims whitespace.
 *
 * @example
 * const email = Email.create('user@example.com');
 * const normalizedEmail = Email.create('  USER@EXAMPLE.COM  '); // becomes 'user@example.com'
 */
export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(public readonly value: string) {}

  /**
   * Factory method to create an Email instance with validation.
   * @param value - The email address string
   * @throws InvalidEmailException if email format is invalid
   */
  static create(value: string): Email {
    const trimmed = value.trim().toLowerCase();

    if (!Email.EMAIL_REGEX.test(trimmed)) {
      throw new InvalidEmailException(`Invalid email format: ${value}`);
    }

    return new Email(trimmed);
  }

  /**
   * Checks equality with another Email value.
   * @param other - The Email to compare
   * @returns true if both email values are equal
   */
  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
