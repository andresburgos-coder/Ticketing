import { Event } from '../entities/event.entity';

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
   * @returns Promise resolving to the Event if found, null otherwise
   */
  findById(id: string): Promise<Event | null>;

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
}
