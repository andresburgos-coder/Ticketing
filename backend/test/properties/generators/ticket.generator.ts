import * as fc from 'fast-check';
import { TicketType } from '../../../src/domain/value-objects/ticket-type.vo';
import { validEmailArbitrary } from './email.generator';

/**
 * Generator for Ticket data
 * Creates realistic ticket objects for property-based testing
 * 
 * Note: Ticket codes are generated using UUID to ensure global uniqueness
 * across all property test iterations, preventing database constraint violations.
 */
export const ticketDataArbitrary = fc.record({
  id: fc.uuid(),
  code: fc.uuid().map(uuid => `TKT-${uuid.substring(0, 12).toUpperCase()}`),
  eventId: fc.uuid(),
  type: fc.constantFrom(TicketType.VIP, TicketType.GENERAL, TicketType.EARLY_BIRD),
  buyerEmail: validEmailArbitrary,
  price: fc.integer({ min: 10000, max: 500000 }),
  purchaseDate: fc.date({
    min: new Date('2025-01-01'),
    max: new Date('2025-12-31'),
  }),
});

/**
 * Generator for multiple tickets
 * Useful for testing batch operations
 */
export const ticketsArbitrary = fc.array(ticketDataArbitrary, {
  minLength: 1,
  maxLength: 10,
});

/**
 * Generator for tickets grouped by buyer
 * Ensures multiple tickets have the same buyer email
 * Uses UUID-based codes to guarantee uniqueness across iterations
 */
export const ticketsByBuyerArbitrary = fc.tuple(
  validEmailArbitrary,
  fc.array(
    fc.record({
      id: fc.uuid(),
      code: fc.uuid().map(uuid => `TKT-${uuid.substring(0, 12).toUpperCase()}`),
      eventId: fc.uuid(),
      type: fc.constantFrom(TicketType.VIP, TicketType.GENERAL, TicketType.EARLY_BIRD),
      price: fc.integer({ min: 10000, max: 500000 }),
      purchaseDate: fc.date({
        min: new Date('2025-01-01'),
        max: new Date('2025-12-31'),
      }),
    }),
    { minLength: 1, maxLength: 5 }
  )
).map(([buyerEmail, tickets]) => ({
  buyerEmail,
  tickets: tickets.map(t => ({ ...t, buyerEmail })),
}));

/**
 * Generator for tickets grouped by event
 * Ensures multiple tickets belong to the same event
 * Uses UUID-based codes to guarantee uniqueness across iterations
 */
export const ticketsByEventArbitrary = fc.tuple(
  fc.uuid(),
  fc.array(
    fc.record({
      id: fc.uuid(),
      code: fc.uuid().map(uuid => `TKT-${uuid.substring(0, 12).toUpperCase()}`),
      type: fc.constantFrom(TicketType.VIP, TicketType.GENERAL, TicketType.EARLY_BIRD),
      buyerEmail: validEmailArbitrary,
      price: fc.integer({ min: 10000, max: 500000 }),
      purchaseDate: fc.date({
        min: new Date('2025-01-01'),
        max: new Date('2025-12-31'),
      }),
    }),
    { minLength: 1, maxLength: 5 }
  )
).map(([eventId, tickets]) => ({
  eventId,
  tickets: tickets.map(t => ({ ...t, eventId })),
}));
