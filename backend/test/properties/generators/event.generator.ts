import * as fc from "fast-check";
import { TicketType } from "../../../src/domain/value-objects/ticket-type.vo";
import {
  validAmountArbitrary,
  validCurrencyArbitrary,
} from "./money.generator";

/**
 * Generator for valid TicketType enum values
 */
export const ticketTypeArbitrary = fc.constantFrom(
  TicketType.VIP,
  TicketType.GENERAL,
  TicketType.EARLY_BIRD,
);

/**
 * Generator for valid ticket quantities (1-10 as per requirements)
 */
export const validTicketQuantityArbitrary = fc.integer({ min: 1, max: 10 });

/**
 * Generator for valid total quantity (10-1000)
 */
export const validTotalQuantityArbitrary = fc.integer({ min: 10, max: 1000 });

/**
 * Generator for valid available quantity (0 to total quantity)
 */
export const validAvailableQuantityArbitrary = (totalQuantity: number) =>
  fc.integer({ min: 0, max: totalQuantity });

/**
 * Generator for ticket configuration data
 */
export const ticketConfigurationArbitrary = fc
  .record({
    type: ticketTypeArbitrary,
    price: fc.record({
      amount: validAmountArbitrary,
      currency: validCurrencyArbitrary,
    }),
    totalQuantity: validTotalQuantityArbitrary,
  })
  .chain((config) =>
    validAvailableQuantityArbitrary(config.totalQuantity).map(
      (availableQuantity) => ({
        ...config,
        availableQuantity,
      }),
    ),
  );

/**
 * Generator for Event data with multiple ticket configurations
 */
export const eventDataArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  date: fc.date({
    min: new Date(),
    max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  }),
  location: fc.string({ minLength: 1, maxLength: 100 }),
  ticketConfigurations: fc
    .array(ticketConfigurationArbitrary, { minLength: 1, maxLength: 3 })
    .map((configs) => {
      // Ensure unique ticket types
      const uniqueConfigs = configs.reduce(
        (acc, config) => {
          if (!acc.some((c) => c.type === config.type)) {
            acc.push(config);
          }
          return acc;
        },
        [] as typeof configs,
      );
      return uniqueConfigs;
    }),
});

/**
 * Generator for reservation operations (reserve/release with quantity)
 */
export const reservationOperationArbitrary = fc.record({
  ticketType: ticketTypeArbitrary,
  quantity: validTicketQuantityArbitrary,
  operation: fc.constantFrom("reserve" as const, "release" as const),
});

/**
 * Generator for a sequence of reservation operations
 */
export const reservationSequenceArbitrary = fc.array(
  reservationOperationArbitrary,
  { minLength: 1, maxLength: 10 },
);
