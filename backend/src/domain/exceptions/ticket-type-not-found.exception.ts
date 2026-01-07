/**
 * Exception thrown when a ticket type is not found in an event's configuration.
 */
export class TicketTypeNotFoundException extends Error {
  constructor(ticketType: string) {
    super(`Ticket type '${ticketType}' not found in event configuration`);
    this.name = 'TicketTypeNotFoundException';
  }
}