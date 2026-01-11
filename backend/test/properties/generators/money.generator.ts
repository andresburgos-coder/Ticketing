import * as fc from 'fast-check';

/**
 * Generator for valid Money amounts (non-negative numbers)
 * Using Math.fround to ensure 32-bit float compatibility
 */
export const validAmountArbitrary = fc.float({
  min: Math.fround(0.01),
  max: Math.fround(100000),
  noNaN: true,
});

/**
 * Generator for valid 3-letter currency codes
 */
export const validCurrencyArbitrary = fc.constantFrom('COP', 'USD', 'EUR', 'GBP');

/**
 * Generator for valid Money data
 */
export const validMoneyArbitrary = fc.record({
  amount: validAmountArbitrary,
  currency: validCurrencyArbitrary,
});

/**
 * Generator for positive multiplication factors
 * Using Math.fround to ensure 32-bit float compatibility
 */
export const positiveFactorArbitrary = fc.float({
  min: Math.fround(0.01),
  max: Math.fround(10),
  noNaN: true,
});

/**
 * Ticket type pricing multipliers as defined in requirements
 */
export const PRICING_MULTIPLIERS = {
  VIP: 1.5,
  GENERAL: 1.0,
  EARLY_BIRD: 0.8,
} as const;

/**
 * Generator for ticket type with its corresponding multiplier
 */
export const ticketTypePricingArbitrary = fc.constantFrom(
  { type: 'VIP' as const, multiplier: PRICING_MULTIPLIERS.VIP },
  { type: 'GENERAL' as const, multiplier: PRICING_MULTIPLIERS.GENERAL },
  { type: 'EARLY_BIRD' as const, multiplier: PRICING_MULTIPLIERS.EARLY_BIRD },
);

/**
 * Generator for valid ticket quantities (1-10 as per requirements)
 */
export const validQuantityArbitrary = fc.integer({ min: 1, max: 10 });
