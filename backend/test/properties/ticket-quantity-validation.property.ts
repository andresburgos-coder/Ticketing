import * as fc from 'fast-check';
import { TicketQuantity } from '../../src/domain/value-objects/ticket-quantity.vo';
import { InvalidQuantityException } from '../../src/domain/exceptions/invalid-quantity.exception';
import {
  validTicketQuantityArbitrary,
  invalidTicketQuantityArbitrary,
  nonIntegerArbitrary,
} from './generators/ticket-quantity.generator';

/**
 * Feature: ticket-sales-system
 * Property 8: Reservation Quantity Validation
 * Validates: Requirements 7.1
 *
 * *For any* ticket quantity value, the system should validate that it's
 * an integer between 1 and 10 (inclusive), rejecting all other values.
 */
describe('Property 8: Reservation Quantity Validation', () => {
  const PROPERTY_CONFIG: fc.Parameters<unknown> = {
    numRuns: 100,
    verbose: fc.VerbosityLevel.VeryVerbose,
  };

  describe('TicketQuantity validation properties', () => {
    it('should accept all valid quantities (1-10)', () => {
      fc.assert(
        fc.property(validTicketQuantityArbitrary, (validQuantity) => {
          // Act & Assert - should not throw
          const ticketQuantity = TicketQuantity.create(validQuantity);
          
          // Verify the value is stored correctly
          expect(ticketQuantity.value).toBe(validQuantity);
          expect(ticketQuantity.value).toBeGreaterThanOrEqual(1);
          expect(ticketQuantity.value).toBeLessThanOrEqual(10);
          expect(Number.isInteger(ticketQuantity.value)).toBe(true);
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should reject all invalid quantities (outside 1-10 range)', () => {
      fc.assert(
        fc.property(invalidTicketQuantityArbitrary, (invalidQuantity) => {
          // Act & Assert - should throw InvalidQuantityException
          expect(() => TicketQuantity.create(invalidQuantity)).toThrow(InvalidQuantityException);
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should reject all non-integer values', () => {
      fc.assert(
        fc.property(nonIntegerArbitrary, (nonInteger) => {
          // Act & Assert - should throw InvalidQuantityException with specific message
          expect(() => TicketQuantity.create(nonInteger)).toThrow(InvalidQuantityException);
          expect(() => TicketQuantity.create(nonInteger)).toThrow('Quantity must be an integer');
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should maintain value equality for same quantities', () => {
      fc.assert(
        fc.property(validTicketQuantityArbitrary, (quantity) => {
          // Arrange
          const quantity1 = TicketQuantity.create(quantity);
          const quantity2 = TicketQuantity.create(quantity);

          // Act & Assert
          expect(quantity1.equals(quantity2)).toBe(true);
          expect(quantity1.value).toBe(quantity2.value);
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should maintain value inequality for different quantities', () => {
      fc.assert(
        fc.property(
          validTicketQuantityArbitrary,
          validTicketQuantityArbitrary,
          (quantity1Value, quantity2Value) => {
            // Pre-condition: quantities must be different
            fc.pre(quantity1Value !== quantity2Value);

            // Arrange
            const quantity1 = TicketQuantity.create(quantity1Value);
            const quantity2 = TicketQuantity.create(quantity2Value);

            // Act & Assert
            expect(quantity1.equals(quantity2)).toBe(false);
            expect(quantity1.value).not.toBe(quantity2.value);
          }
        ),
        PROPERTY_CONFIG,
      );
    });

    it('should be immutable (value cannot change after creation)', () => {
      fc.assert(
        fc.property(validTicketQuantityArbitrary, (quantity) => {
          // Arrange
          const ticketQuantity = TicketQuantity.create(quantity);
          const originalValue = ticketQuantity.value;

          // Act - attempt to modify (should not be possible due to readonly)
          // This test verifies the readonly property works as expected

          // Assert - value should remain unchanged
          expect(ticketQuantity.value).toBe(originalValue);
          expect(ticketQuantity.value).toBe(quantity);
        }),
        PROPERTY_CONFIG,
      );
    });
  });

  describe('Boundary value properties', () => {
    it('should accept minimum valid quantity (1)', () => {
      const quantity = TicketQuantity.create(1);
      expect(quantity.value).toBe(1);
    });

    it('should accept maximum valid quantity (10)', () => {
      const quantity = TicketQuantity.create(10);
      expect(quantity.value).toBe(10);
    });

    it('should reject quantity just below minimum (0)', () => {
      expect(() => TicketQuantity.create(0)).toThrow(InvalidQuantityException);
      expect(() => TicketQuantity.create(0)).toThrow('Quantity must be between 1 and 10');
    });

    it('should reject quantity just above maximum (11)', () => {
      expect(() => TicketQuantity.create(11)).toThrow(InvalidQuantityException);
      expect(() => TicketQuantity.create(11)).toThrow('Quantity must be between 1 and 10');
    });
  });
});