import { Money } from "../value-objects/money.vo";
import { TicketType } from "../value-objects/ticket-type.vo";

/**
 * Interface for pricing strategies following the Strategy Pattern.
 * Each ticket type has its own pricing strategy.
 */
export interface IPricingStrategy {
  readonly ticketType: TicketType;
  calculatePrice(basePrice: Money, quantity: number): Money;
}
