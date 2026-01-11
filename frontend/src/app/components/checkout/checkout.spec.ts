import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Checkout } from './checkout';
import { CheckoutService } from '../../features/checkout/services/checkout.service';
import { ContactForm } from '../../features/checkout/components/contact-form/contact-form';
import { PaymentForm } from '../../features/checkout/components/payment-form/payment-form';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';

describe('Checkout', () => {
  let component: Checkout;
  let fixture: ComponentFixture<Checkout>;
  let router: Router;
  let checkoutService: Partial<CheckoutService>;

  beforeEach(async () => {
    const routerMock = {
      navigate: vi.fn()
    };

    checkoutService = {
      cart: signal([
        { ticketTypeId: 1, ticketTypeName: 'VIP', quantity: 2, price: 100 }
      ]),
      isLoading: signal(false),
      reservation: signal(null),
      cartItemCount: signal(2),
      confirmOrder: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: CheckoutService, useValue: checkoutService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should redirect if cart is empty', () => {
      (checkoutService as any).cart = signal([]);
      component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should not redirect if cart has items', () => {
      component.ngOnInit();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('step navigation', () => {
    it('should start at contact step', () => {
      expect(component.step).toBe('contact');
    });

    it('should move to payment step when contact form is valid', () => {
      component.contactForm = {
        validate: vi.fn().mockReturnValue(true)
      } as any;

      component.nextStep();

      expect(component.step).toBe('payment');
    });

    it('should not move to payment step when contact form is invalid', () => {
      component.contactForm = {
        validate: vi.fn().mockReturnValue(false)
      } as any;

      component.nextStep();

      expect(component.step).toBe('contact');
    });

    it('should confirm order when payment form is valid', () => {
      component.step = 'payment';
      component.paymentForm = {
        validate: vi.fn().mockReturnValue(true)
      } as any;

      component.nextStep();

      expect(checkoutService.confirmOrder).toHaveBeenCalledWith('stripe');
    });

    it('should go back from payment to contact', () => {
      component.step = 'payment';
      component.previousStep();

      expect(component.step).toBe('contact');
    });

    it('should not go back from contact step', () => {
      component.step = 'contact';
      component.previousStep();

      expect(component.step).toBe('contact');
    });
  });

  describe('confirmOrder', () => {
    it('should confirm order and navigate to confirmation', async () => {
      vi.useFakeTimers();

      component.confirmOrder();

      expect(checkoutService.confirmOrder).toHaveBeenCalledWith('stripe');

      vi.advanceTimersByTime(1000);

      expect(router.navigate).toHaveBeenCalledWith(['/confirmation']);

      vi.useRealTimers();
    });
  });
});
