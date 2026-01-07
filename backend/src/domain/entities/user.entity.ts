import * as bcrypt from 'bcrypt';
import { Email } from '../value-objects/email.vo';

/**
 * User role type - defines the role of a user in the system
 */
export type UserRole = 'BUYER' | 'ORGANIZER' | 'ADMIN';

/**
 * User Entity - Represents a user in the system.
 * Handles password hashing and verification using bcrypt.
 * Follows Domain-Driven Design principles.
 */
export class User {
  private static readonly BCRYPT_ROUNDS = 10;

  constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly passwordHash: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: UserRole,
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * Hashes a plain text password using bcrypt.
   * @param plainPassword - The plain text password to hash
   * @returns Promise<string> - The hashed password
   */
  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, User.BCRYPT_ROUNDS);
  }

  /**
   * Verifies a plain text password against a hashed password.
   * @param plainPassword - The plain text password to verify
   * @param hashedPassword - The hashed password to compare against
   * @returns Promise<boolean> - True if password matches, false otherwise
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
