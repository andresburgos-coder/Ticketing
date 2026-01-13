import { User } from "../entities/user.entity";
import { Email } from "../value-objects/email.vo";
import { UserRole } from "../enums/user-role.enum";

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
  findByEmail(email: Email | string): Promise<User | null>;

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
  update(id: string, data: Partial<User>): Promise<User>;

  /**
   * Deletes a user by ID
   * @param id - The user ID to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string): Promise<void>;

  /**
   * Finds users with filters and pagination
   * @param filters - Filter criteria
   * @returns Promise resolving to array of users
   */
  findWithFilters(filters: {
    email?: string;
    role?: UserRole;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<User[]>;

  /**
   * Counts users with filters
   * @param filters - Filter criteria
   * @returns Promise resolving to count
   */
  countWithFilters(filters: {
    email?: string;
    role?: UserRole;
    search?: string;
  }): Promise<number>;

  /**
   * Counts total users
   * @returns Promise resolving to total count
   */
  count(): Promise<number>;
}

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");
