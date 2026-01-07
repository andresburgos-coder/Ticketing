import * as fc from 'fast-check';

/**
 * Generator for valid ticket quantities (1-10 as per requirements)
 */
export const validTicketQuantityArbitrary = fc.integer({ min: 1, max: 10 });

/**
 * Generator for invalid ticket quantities (outside valid range)
 */
export const invalidTicketQuantityArbitrary = fc.oneof(
  fc.integer({ min: -100, max: 0 }), // Negative and zero
  fc.integer({ min: 11, max: 100 }) // Above maximum
);

/**
 * Generator for any integer (valid or invalid)
 */
export const anyIntegerArbitrary = fc.integer({ min: -100, max: 100 });

/**
 * Generator for non-integer numbers
 */
export const nonIntegerArbitrary = fc.float({ 
  min: Math.fround(-100), 
  max: Math.fround(100) 
}).filter(n => !Number.isInteger(n));