import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';

/**
 * IUserRepository Interface
 * Defines the contract for persisting and retrieving User entities
 * Follows Dependency Inversion Principle (DIP)
 * 
 * Requirements: 9.1, 9.2
 * - 9.1: User registration and authentication
 * - 9.2: JWT token generation and validation
 */
export interface IUserRepository {
  /**
   * Saves a new user to the repository
   * @param user - The User entity to save
   * @returns Promise resolving to the saved User with ID
   * @throws Error if save operation fails or user already exists
   */
  save(user: User): Promise<User>;

  /**
   * Finds a user by email
   * @param email - The Email value object to search for
   * @returns Promise resolving to the User if found, null otherwise
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Finds a user by ID
   * @param id - The user ID to search for
   * @returns Promise resolving to the User if found, null otherwise
   */
  findById(id: string): Promise<User | null>;

  /**
   * Updates an existing user in the repository
   * @param user - The User entity with updated data
   * @returns Promise resolving to the updated User
   * @throws Error if user not found or update fails
   */
  update(user: User): Promise<User>;
}
