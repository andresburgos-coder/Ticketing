import { Reservation } from '../entities/reservation.entity';

/**
 * IReservationRepository Interface
 * Defines the contract for persisting and retrieving Reservation entities
 * Follows Dependency Inversion Principle (DIP)
 * 
 * Requirements: 3.1, 3.3, 3.4
 * - 3.1: Create reservation with Active state
 * - 3.3: Find and process expired reservations
 * - 3.4: Return unique reservation identifier
 */
export interface IReservationRepository {
  /**
   * Saves a new reservation to the repository
   * @param reservation - The Reservation entity to save
   * @returns Promise resolving to the saved Reservation with ID
   * @throws Error if save operation fails
   */
  save(reservation: Reservation): Promise<Reservation>;

  /**
   * Finds a reservation by its unique identifier
   * @param id - The reservation ID to search for
   * @returns Promise resolving to the Reservation if found, null otherwise
   */
  findById(id: string): Promise<Reservation | null>;

  /**
   * Finds all expired reservations that need to be processed
   * Requirements: 3.3 - Find reservations with expiresAt < now and status ACTIVE
   * Used by scheduled jobs to automatically release tickets
   * @returns Promise resolving to array of expired Reservations
   */
  findExpired(): Promise<Reservation[]>;

  /**
   * Updates an existing reservation in the repository
   * Typically used to change reservation status (ACTIVE -> CONFIRMED/EXPIRED/CANCELLED)
   * @param reservation - The Reservation entity with updated data
   * @returns Promise resolving to the updated Reservation
   * @throws Error if reservation not found or update fails
   */
  update(reservation: Reservation): Promise<Reservation>;
}
