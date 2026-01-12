import { Money } from "../value-objects/money.vo";
import { TicketType } from "../value-objects/ticket-type.vo";
import { IPricingStrategy } from "./pricing-strategy.interface";

/**
 * VIP Pricing Strategy - Applies a 1.5x multiplier to the base price.
 * VIP tickets are premium and cost 50% more than the base price.
 *
 * @example
 * const strategy = new VipPricingStrategy();
 * const basePrice = Money.create(100, 'COP');
 * const total = strategy.calculatePrice(basePrice, 2); // 300 COP (100 * 2 * 1.5)
 */
export class VipPricingStrategy implements IPricingStrategy {
  readonly ticketType = TicketType.VIP;
  private readonly PREMIUM_MULTIPLIER = 1.5;

  /**
   * Calculates the total price for VIP tickets.
   * Formula: basePrice * quantity * 1.5
   *
   * @param basePrice - The base price per ticket
   * @param quantity - The number of tickets
   * @returns The total price with VIP premium applied
   */
  calculatePrice(basePrice: Money, quantity: number): Money {
    return basePrice.multiply(quantity).multiply(this.PREMIUM_MULTIPLIER);
  }
}
