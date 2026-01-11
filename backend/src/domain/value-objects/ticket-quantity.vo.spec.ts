import { TicketQuantity } from './ticket-quantity.vo';
import { InvalidQuantityException } from '../exceptions/invalid-quantity.exception';

describe('TicketQuantity Value Object', () => {
  describe('create', () => {
    it('should create TicketQuantity with valid quantity 1', () => {
      const quantity = TicketQuantity.create(1);

      expect(quantity.value).toBe(1);
    });

    it('should create TicketQuantity with valid quantity 5', () => {
      const quantity = TicketQuantity.create(5);

      expect(quantity.value).toBe(5);
    });

    it('should create TicketQuantity with valid quantity 10', () => {
      const quantity = TicketQuantity.create(10);

      expect(quantity.value).toBe(10);
    });

    it('should throw InvalidQuantityException for quantity 0', () => {
      expect(() => TicketQuantity.create(0)).toThrow(InvalidQuantityException);
      expect(() => TicketQuantity.create(0)).toThrow(
        'Quantity must be between 1 and 10'
      );
    });

    it('should throw InvalidQuantityException for quantity greater than 10', () => {
      expect(() => TicketQuantity.create(11)).toThrow(InvalidQuantityException);
      expect(() => TicketQuantity.create(11)).toThrow(
        'Quantity must be between 1 and 10'
      );
    });

    it('should throw InvalidQuantityException for quantity 15', () => {
      expect(() => TicketQuantity.create(15)).toThrow(InvalidQuantityException);
    });

    it('should throw InvalidQuantityException for negative quantity', () => {
      expect(() => TicketQuantity.create(-1)).toThrow(InvalidQuantityException);
      expect(() => TicketQuantity.create(-1)).toThrow(
        'Quantity must be between 1 and 10'
      );
    });

    it('should throw InvalidQuantityException for non-integer quantity', () => {
      expect(() => TicketQuantity.create(2.5)).toThrow(InvalidQuantityException);
      expect(() => TicketQuantity.create(2.5)).toThrow(
        'Quantity must be an integer'
      );
    });

    it('should throw InvalidQuantityException for decimal quantity', () => {
      expect(() => TicketQuantity.create(1.1)).toThrow(InvalidQuantityException);
    });
  });

  describe('equals', () => {
    it('should return true for TicketQuantity with same value', () => {
      const quantity1 = TicketQuantity.create(5);
      const quantity2 = TicketQuantity.create(5);

      expect(quantity1.equals(quantity2)).toBe(true);
    });

    it('should return false for TicketQuantity with different values', () => {
      const quantity1 = TicketQuantity.create(3);
      const quantity2 = TicketQuantity.create(7);

      expect(quantity1.equals(quantity2)).toBe(false);
    });
  });
});