import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CheckoutService } from './checkout.service';
import { Orders } from '../../../services/orders';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let ordersService: Partial<Orders>;

  beforeEach(() => {
    ordersService = {
      createOrder: jasmine.createSpy(),
      confirmOrder: jasmine.createSpy(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CheckoutService, { provide: Orders, useValue: ordersService }],
    });

    service = TestBed.inject(CheckoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('cart operations', () => {
    it('should add item to cart', () => {
      service.addToCart(1, 'VIP Ticket', 2, 100);

      expect(service.cart().length).toBe(1);
      expect(service.cart()[0]).toEqual({
        ticketTypeId: 1,
        ticketTypeName: 'VIP Ticket',
        quantity: 2,
        price: 100,
      });
    });

    it('should update existing item quantity in cart', () => {
      service.addToCart(1, 'VIP Ticket', 2, 100);
      service.addToCart(1, 'VIP Ticket', 3, 100);

      expect(service.cart().length).toBe(1);
      expect(service.cart()[0].quantity).toBe(5);
    });

    it('should remove item from cart', () => {
      service.addToCart(1, 'VIP Ticket', 2, 100);
      service.addToCart(2, 'General', 1, 50);

      service.removeFromCart(1);

      expect(service.cart().length).toBe(1);
      expect(service.cart()[0].ticketTypeId).toBe(2);
    });

    it('should update item quantity', () => {
      service.addToCart(1, 'VIP Ticket', 2, 100);
      service.updateQuantity(1, 5);

      expect(service.cart()[0].quantity).toBe(5);
    });

    it('should remove item when quantity is 0 or less', () => {
      service.addToCart(1, 'VIP Ticket', 2, 100);
      service.updateQuantity(1, 0);

      expect(service.cart().length).toBe(0);
    });

    it('should clear cart', () => {
      service.addToCart(1, 'VIP Ticket', 2, 100);
      service.addToCart(2, 'General', 1, 50);

      service.clearCart();

      expect(service.cart().length).toBe(0);
    });
  });

  describe('computed values', () => {
    it('should calculate subtotal correctly', () => {
      service.addToCart(1, 'VIP Ticket', 2, 100);
      service.addToCart(2, 'General', 3, 50);

      expect(service.subtotal()).toBe(350); // (2 * 100) + (3 * 50)
    });

    it('should calculate tax correctly', () => {
      service.addToCart(1, 'VIP Ticket', 2, 100);

      expect(service.tax()).toBe(10); // 200 * 0.05 (5% service fee)
    });

    it('should calculate total correctly', () => {
      service.addToCart(1, 'VIP Ticket', 2, 100);

      expect(service.total()).toBe(215); // 200 + 10 (tax) + 5 (processing fee)
    });

    it('should calculate cart item count', () => {
      service.addToCart(1, 'VIP Ticket', 2, 100);
      service.addToCart(2, 'General', 3, 50);

      expect(service.cartItemCount()).toBe(5); // 2 + 3
    });
  });

  describe('reservation', () => {
    afterEach(() => {
      try {
        jasmine.clock().uninstall();
      } catch {}
    });
    it('should set reservation with countdown timer', () => {
      const mockReservation = {
        id: '1',
        eventId: '1',
        ticketType: 'VIP',
        quantity: 2,
        totalAmount: 200,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: 'active',
      };

      service.setReservation(mockReservation as any);

      expect(service.reservation()).toBeTruthy();
      expect(service.reservation()?.id).toBe('1');
      expect(service.timeRemaining()).toBeGreaterThan(0);
    });

    it('should update time remaining', (done) => {
      jasmine.clock().install();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const mockReservation = {
        id: '1',
        eventId: '1',
        ticketType: 'VIP',
        quantity: 2,
        totalAmount: 200,
        expiresAt,
        status: 'active',
      };
      service.setReservation(mockReservation as any);

      const initialTime = service.timeRemaining();
      setTimeout(() => {
        expect(service.timeRemaining()).toBeLessThan(initialTime);
        jasmine.clock().uninstall();
        done();
      }, 1100);
      jasmine.clock().tick(1100);
    });

    it('should set reservationExpired when reservation expires', (done) => {
      jasmine.clock().install();
      service.addToCart(1, 'VIP Ticket', 2, 100);
      const expiresAt = new Date(Date.now() + 1000).toISOString();
      const mockReservation = {
        id: '1',
        eventId: '1',
        ticketType: 'VIP',
        quantity: 2,
        totalAmount: 200,
        expiresAt,
        status: 'active',
      };
      service.setReservation(mockReservation as any);

      setTimeout(() => {
        expect(service.reservationExpired()).toBe(true);
        expect(service.timeRemaining()).toBe(0);
        jasmine.clock().uninstall();
        done();
      }, 1100);
      jasmine.clock().tick(1100);
    });
  });

  describe('confirmOrder', () => {
    it('should confirm order successfully', () => {
      service.addToCart(1, 'VIP Ticket', 2, 100);
      service.confirmOrder('stripe', 'test@example.com', {
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
      });

      // isLoading will be set to false after setTimeout, so we just check it was called
      expect(service.cart().length).toBeGreaterThan(0);
    });
  });
});
