import { Money } from '../value-objects/money.vo';
import { TicketType } from '../value-objects/ticket-type.vo';
import { IPricingStrategy } from './pricing-strategy.interface';

/**
 * General Pricing Strategy - Applies no multiplier (1.0x) to the base price.
 * General tickets are standard price without any premium or discount.
 *
 * @example
 * const strategy = new GeneralPricingStrategy();
 * const basePrice = Money.create(100, 'COP');
 * const total = strategy.calculatePrice(basePrice, 2); // 200 COP (100 * 2 * 1.0)
 */
export class GeneralPricingStrategy implements IPricingStrategy {
  readonly ticketType = TicketType.GENERAL;
  private readonly STANDARD_MULTIPLIER = 1.0;

  /**
   * Calculates the total price for general tickets.
   * Formula: basePrice * quantity * 1.0
   *
   * @param basePrice - The base price per ticket
   * @param quantity - The number of tickets
   * @returns The total price at standard rate
   */
  calculatePrice(basePrice: Money, quantity: number): Money {
    return basePrice.multiply(quantity).multiply(this.STANDARD_MULTIPLIER);
  }
}
