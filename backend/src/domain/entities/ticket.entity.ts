import { TicketType } from "../value-objects/ticket-type.vo";
import { Email } from "../value-objects/email.vo";
import { Money } from "../value-objects/money.vo";

/**
 * Ticket Status Enum
 * Represents the lifecycle of a ticket
 */
export enum TicketStatus {
  PAID = "PAID", // Ticket purchased and paid
  USED = "USED", // Ticket already used for event entry
}

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
  qrToken: string;
  status: TicketStatus;
  usedAt: string | null;
}

/**
 * Ticket Entity - Represents a purchased ticket for an event
 * Immutable entity that contains all ticket information
 *
 * Requirements: 4.4, 6.2
 * - 4.4: Tickets are generated with unique code, event, type and buyer data
 * - 6.2: Each ticket includes: code, event name, ticket type, purchase date
 * - QR Token: Unique token for ticket validation (UUID)
 * - Status: PAID or USED
 * - UsedAt: Timestamp when ticket was validated
 */
export class Ticket {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly eventId: string,
    public readonly type: TicketType,
    public readonly buyerEmail: Email,
    public readonly price: Money,
    public readonly purchaseDate: Date,
    public readonly qrToken: string,
    public readonly status: TicketStatus = TicketStatus.PAID,
    public readonly usedAt: Date | null = null,
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
      qrToken: this.qrToken,
      status: this.status,
      usedAt: this.usedAt ? this.usedAt.toISOString() : null,
    };
  }

  /**
   * Mark ticket as used
   * @returns New Ticket instance with USED status and usedAt timestamp
   */
  markAsUsed(): Ticket {
    if (this.status === TicketStatus.USED) {
      throw new Error("Ticket already used");
    }
    return new Ticket(
      this.id,
      this.code,
      this.eventId,
      this.type,
      this.buyerEmail,
      this.price,
      this.purchaseDate,
      this.qrToken,
      TicketStatus.USED,
      new Date(),
    );
  }
}
