import { Ticket } from "../entities/ticket.entity";
import { Email } from "../value-objects/email.vo";

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

  /**
   * Finds a ticket by its QR token
   * Used for ticket validation at event entrance
   * @param qrToken - The unique QR token (UUID)
   * @returns Promise resolving to the Ticket or null if not found
   */
  findByQRToken(qrToken: string): Promise<Ticket | null>;

  /**
   * Finds a ticket by its ID
   * @param id - The ticket ID
   * @returns Promise resolving to the Ticket or null if not found
   */
  findById(id: string): Promise<Ticket | null>;

  // Admin methods for statistics and management
  findWithFilters(filters: {
    eventId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Ticket[]>;

  countWithFilters(filters: {
    eventId?: string;
    status?: string;
  }): Promise<number>;

  countSold(): Promise<number>;
  countByEvent(eventId: string): Promise<number>;
  countSoldByEvent(eventId: string): Promise<number>;
  countUsedByEvent(eventId: string): Promise<number>;
  countTotalByEvent(eventId: string): Promise<number>;

  getTotalRevenue(): Promise<number>;
  getRevenueByEvent(eventId: string): Promise<number>;

  getTicketsByStatus(): Promise<Array<{ status: string; count: number }>>;
  getTicketsByType(): Promise<Array<{ type: string; count: number }>>;
  getTicketsByTypeForEvent(
    eventId: string,
  ): Promise<Array<{ type: string; count: number }>>;

  getSalesByMonth(): Promise<
    Array<{ month: string; count: number; revenue: number }>
  >;
  getSalesByDateForEvent(
    eventId: string,
  ): Promise<Array<{ date: string; count: number }>>;
  getSalesTrendForEvent(
    eventId: string,
  ): Promise<Array<{ date: string; count: number }>>;

  getTopSellingEvents(limit: number): Promise<
    Array<{
      eventId: string;
      eventName: string;
      ticketsSold: number;
      revenue: number;
    }>
  >;
}
export const TICKET_REPOSITORY = Symbol("TICKET_REPOSITORY");
