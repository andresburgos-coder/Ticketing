import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Confirmation } from './confirmation';
import { CheckoutService } from '../../features/checkout/services/checkout.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';

describe('Confirmation', () => {
  let component: Confirmation;
  let fixture: ComponentFixture<Confirmation>;
  let router: Router;
  let checkoutService: Partial<CheckoutService>;

  beforeEach(async () => {
    const routerMock = {
      navigate: vi.fn()
    };

    checkoutService = {
      total: signal(220),
      cartItemCount: signal(2),
      clearCart: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Confirmation],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: CheckoutService, useValue: checkoutService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Confirmation);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate order ID', () => {
    expect(component.orderId).toMatch(/^ORD-[A-Z0-9]+$/);
  });

  it('should generate QR code URL', () => {
    expect(component.qrCode).toContain('https://api.qrserver.com');
    expect(component.qrCode).toContain(component.orderId);
  });

  it('should log message when downloading tickets', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    component.downloadTickets();

    expect(consoleSpy).toHaveBeenCalledWith('Downloading tickets...');
    consoleSpy.mockRestore();
  });

  it('should navigate to home and clear cart when continue shopping', () => {
    component.continueShopping();

    expect(checkoutService.clearCart).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
