import { Ticket } from '../entities/ticket.entity';
import { Email } from '../value-objects/email.vo';

/**
 * ITicketRepository Interface
 * Defines the contract for persisting and retrieving Ticket entities
 * Follows Dependency Inversion Principle (DIP)
 * 
 * Requirements: 4.4, 6.1
 * - 4.4: Generate tickets with unique code, event, type and buyer data
 * - 6.1: Return all confirmed tickets for a buyer
 */
export interface ITicketRepository {
  /**
   * Saves a single ticket to the repository
   * @param ticket - The Ticket entity to save
   * @returns Promise resolving to the saved Ticket
   * @throws Error if save operation fails
   */
  save(ticket: Ticket): Promise<Ticket>;

  /**
   * Saves multiple tickets in a single operation
   * Useful for batch operations after successful payment
   * @param tickets - Array of Ticket entities to save
   * @returns Promise resolving to array of saved Tickets
   * @throws Error if any save operation fails
   */
  saveMany(tickets: Ticket[]): Promise<Ticket[]>;

  /**
   * Finds all tickets purchased by a specific buyer
   * Requirements: 6.1 - Return all confirmed tickets for a buyer
   * @param email - The Email value object of the buyer
   * @returns Promise resolving to array of Tickets for the buyer
   */
  findByBuyer(email: Email): Promise<Ticket[]>;

  /**
   * Finds all tickets for a specific event
   * Useful for event statistics and availability tracking
   * @param eventId - The ID of the event
   * @returns Promise resolving to array of Tickets for the event
   */
  findByEvent(eventId: string): Promise<Ticket[]>;
}
