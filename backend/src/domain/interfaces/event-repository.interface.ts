import { Event } from "../entities/event.entity";

/**
 * IEventRepository Interface
 * Defines the contract for persisting and retrieving Event entities
 * Follows Dependency Inversion Principle (DIP) - high-level modules depend on abstractions
 *
 * Requirements: 1.1, 1.3
 * - 1.1: Persist event and return unique identifier
 * - 1.3: Return event with all ticket types and current availability
 */
export interface IEventRepository {
  /**
   * Saves a new event to the repository
   * @param event - The Event entity to save
   * @returns Promise resolving to the saved Event with ID
   * @throws Error if save operation fails
   */
  save(event: Event): Promise<Event>;

  /**
   * Finds an event by its unique identifier
   * @param id - The event ID to search for
   * @param lock - Whether to lock the row for update (prevents concurrent modifications)
   * @returns Promise resolving to the Event if found, null otherwise
   */
  findById(id: string, lock?: boolean): Promise<Event | null>;

  /**
   * Retrieves all events from the repository
   * @returns Promise resolving to an array of all Events
   */
  findAll(): Promise<Event[]>;

  /**
   * Updates an existing event in the repository
   * @param event - The Event entity with updated data
   * @returns Promise resolving to the updated Event
   * @throws Error if event not found or update fails
   */
  update(event: Event): Promise<Event>;

  /**
   * Deletes an event from the repository
   * @param id - The ID of the event to delete
   * @returns Promise resolving to void
   * @throws Error if event not found or delete fails
   */
  delete(id: string): Promise<void>;

  // Admin methods for statistics and management
  count(): Promise<number>;
  findRecent(limit: number): Promise<Event[]>;
  findUpcoming(limit: number): Promise<Event[]>;
  findPast(limit: number): Promise<Event[]>;

  getEventsByCategory(): Promise<Array<{ category: string; count: number }>>;
  getEventsByMonth(): Promise<Array<{ month: string; count: number }>>;

  /**
   * Gets the real-time availability for a specific event and ticket type
   * Calculates: totalQuantity - soldTickets - activeReservations
   * @param eventId - The event ID
   * @param ticketType - The ticket type
   * @returns Promise resolving to the real available quantity
   */
  getRealTimeAvailability(eventId: string, ticketType: string): Promise<number>;

  /**
   * Updates the available quantity for a specific ticket configuration
   * This method directly updates the database to ensure consistency
   * @param eventId - The event ID
   * @param ticketType - The ticket type
   * @param newAvailableQuantity - The new available quantity
   */
  updateTicketAvailability(
    eventId: string,
    ticketType: string,
    newAvailableQuantity: number,
  ): Promise<void>;
}

export const EVENT_REPOSITORY = Symbol("EVENT_REPOSITORY");
