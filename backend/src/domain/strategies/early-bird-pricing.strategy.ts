import { Money } from "../value-objects/money.vo";
import { TicketType } from "../value-objects/ticket-type.vo";
import { IPricingStrategy } from "./pricing-strategy.interface";

/**
 * Early Bird Pricing Strategy - Applies a 0.8x multiplier to the base price.
 * Early bird tickets are discounted and cost 20% less than the base price.
 *
 * @example
 * const strategy = new EarlyBirdPricingStrategy();
 * const basePrice = Money.create(100, 'COP');
 * const total = strategy.calculatePrice(basePrice, 2); // 160 COP (100 * 2 * 0.8)
 */
export class EarlyBirdPricingStrategy implements IPricingStrategy {
  readonly ticketType = TicketType.EARLY_BIRD;
  private readonly DISCOUNT_MULTIPLIER = 0.8;

  /**
   * Calculates the total price for early bird tickets.
   * Formula: basePrice * quantity * 0.8
   *
   * @param basePrice - The base price per ticket
   * @param quantity - The number of tickets
   * @returns The total price with early bird discount applied
   */
  calculatePrice(basePrice: Money, quantity: number): Money {
    return basePrice.multiply(quantity).multiply(this.DISCOUNT_MULTIPLIER);
  }
}
