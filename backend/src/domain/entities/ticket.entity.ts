import { TicketType } from '../value-objects/ticket-type.vo';
import { Email } from '../value-objects/email.vo';
import { Money } from '../value-objects/money.vo';

/**
 * Interface for the JSON representation of a Ticket
 * Used for serialization and API responses
 * Requirements: 6.2 - Each ticket includes all required fields
 */
export interface TicketJSON {
  id: string;
  code: string;
  eventId: string;
  type: TicketType;
  buyerEmail: string;
  price: {
    amount: number;
    currency: string;
  };
  purchaseDate: string;
}

/**
 * Ticket Entity - Represents a purchased ticket for an event
 * Immutable entity that contains all ticket information
 * 
 * Requirements: 4.4, 6.2
 * - 4.4: Tickets are generated with unique code, event, type and buyer data
 * - 6.2: Each ticket includes: code, event name, ticket type, purchase date
 */
export class Ticket {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly eventId: string,
    public readonly type: TicketType,
    public readonly buyerEmail: Email,
    public readonly price: Money,
    public readonly purchaseDate: Date
  ) {}

  /**
   * Converts the ticket to a JSON representation
   * Requirements: 6.2 - Include all required ticket fields
   * @returns TicketJSON object with all ticket information
   */
  toJSON(): TicketJSON {
    return {
      id: this.id,
      code: this.code,
      eventId: this.eventId,
      type: this.type,
      buyerEmail: this.buyerEmail.value,
      price: {
        amount: this.price.amount,
        currency: this.price.currency,
      },
      purchaseDate: this.purchaseDate.toISOString(),
    };
  }
}