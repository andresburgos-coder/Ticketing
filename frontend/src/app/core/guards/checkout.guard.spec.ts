import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { checkoutGuard } from './checkout.guard';
import { CheckoutService } from '../../features/checkout/services/checkout.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('checkoutGuard', () => {
  let router: Router;
  let checkoutService: Partial<CheckoutService>;

  beforeEach(() => {
    const routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: CheckoutService, useValue: {
          cart: signal([])
        }}
      ]
    });

    router = TestBed.inject(Router);
    checkoutService = TestBed.inject(CheckoutService);
  });

  it('should allow access when cart has items', () => {
    (checkoutService as any).cart = signal([
      { ticketTypeId: 1, ticketTypeName: 'VIP', quantity: 2, price: 100 }
    ] as any);

    const result = TestBed.runInInjectionContext(() =>
      checkoutGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect when cart is empty', () => {
    (checkoutService as any).cart = signal([]);

    const result = TestBed.runInInjectionContext(() =>
      checkoutGuard({} as any, {} as any)
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
