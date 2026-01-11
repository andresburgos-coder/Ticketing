import { Injectable } from "@nestjs/common";
import { Money } from "../../domain/value-objects/money.vo";
import { TicketType } from "../../domain/value-objects/ticket-type.vo";
import { IPricingStrategy } from "../../domain/strategies/pricing-strategy.interface";
import { VipPricingStrategy } from "../../domain/strategies/vip-pricing.strategy";
import { GeneralPricingStrategy } from "../../domain/strategies/general-pricing.strategy";
import { EarlyBirdPricingStrategy } from "../../domain/strategies/early-bird-pricing.strategy";

/**
 * PricingService - Orchestrates pricing calculations using the Strategy Pattern.
 * Injects pricing strategies for each ticket type and delegates price calculation.
 *
 * This service follows the Single Responsibility Principle by delegating
 * the actual price calculation to specific strategies while managing
 * strategy selection and error handling.
 *
 * @example
 * const service = new PricingService();
 * const basePrice = Money.create(100, 'COP');
 * const totalPrice = service.calculatePrice(TicketType.VIP, basePrice, 2);
 * // Returns Money with amount 300 (100 * 2 * 1.5)
 */
@Injectable()
export class PricingService {
  private readonly strategies: Map<TicketType, IPricingStrategy>;

  constructor() {
    this.strategies = new Map<TicketType, IPricingStrategy>([
      [TicketType.VIP, new VipPricingStrategy()],
      [TicketType.GENERAL, new GeneralPricingStrategy()],
      [TicketType.EARLY_BIRD, new EarlyBirdPricingStrategy()],
    ]);
  }

  /**
   * Calculates the total price for a given ticket type and quantity.
   * Selects the appropriate pricing strategy based on ticket type.
   *
   * @param ticketType - The type of ticket (VIP, GENERAL, EARLY_BIRD)
   * @param basePrice - The base price per ticket
   * @param quantity - The number of tickets
   * @returns The total price calculated using the appropriate strategy
   * @throws Error if no strategy exists for the given ticket type
   */
  calculatePrice(
    ticketType: TicketType,
    basePrice: Money,
    quantity: number,
  ): Money {
    const strategy = this.strategies.get(ticketType);

    if (!strategy) {
      throw new Error(
        `No pricing strategy found for ticket type: ${ticketType}`,
      );
    }

    return strategy.calculatePrice(basePrice, quantity);
  }
}
