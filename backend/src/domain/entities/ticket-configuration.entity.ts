import { TicketType } from '../value-objects/ticket-type.vo';
import { Money } from '../value-objects/money.vo';
import { InsufficientTicketsException } from '../exceptions/insufficient-tickets.exception';

/**
 * TicketConfiguration Entity - Part of Event aggregate.
 * Represents the configuration for a specific ticket type within an event.
 * Manages availability and pricing for a ticket type.
 */
export class TicketConfiguration {
  constructor(
    public readonly type: TicketType,
    public readonly price: Money,
    public readonly totalQuantity: number,
    private _availableQuantity: number
  ) {}

  get availableQuantity(): number {
    return this._availableQuantity;
  }

  /**
   * Decrements the available quantity by the specified amount.
   * @param quantity - The quantity to decrement
   * @throws InsufficientTicketsException if not enough tickets are available
   */
  decrementAvailability(quantity: number): void {
    if (this._availableQuantity < quantity) {
      throw new InsufficientTicketsException(this.type, quantity, this._availableQuantity);
    }
    this._availableQuantity -= quantity;
  }

  /**
   * Increments the available quantity by the specified amount.
   * Will not exceed the total quantity.
   * @param quantity - The quantity to increment
   */
  incrementAvailability(quantity: number): void {
    const newAvailable = this._availableQuantity + quantity;
    if (newAvailable > this.totalQuantity) {
      this._availableQuantity = this.totalQuantity;
    } else {
      this._availableQuantity = newAvailable;
    }
  }
}