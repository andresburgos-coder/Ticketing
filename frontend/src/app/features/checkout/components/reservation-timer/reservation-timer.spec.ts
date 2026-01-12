import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReservationTimer } from './reservation-timer';
import { CheckoutService } from '../../services/checkout.service';

import { signal } from '@angular/core';

describe('ReservationTimer', () => {
  let component: ReservationTimer;
  let fixture: ComponentFixture<ReservationTimer>;
  let checkoutService: Partial<CheckoutService>;

  beforeEach(async () => {
    checkoutService = {
      timeRemaining: signal(900) // 15 minutes in seconds
    };

    await TestBed.configureTestingModule({
      imports: [ReservationTimer],
      providers: [
        { provide: CheckoutService, useValue: checkoutService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationTimer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format time correctly - 15 minutes', () => {
    component['updateDisplayTime']();

    expect(component.displayTime).toBe('15:00');
  });

  it('should format time correctly - 5 minutes 30 seconds', () => {
    (checkoutService as any).timeRemaining = signal(330);
    fixture.detectChanges();
    component['updateDisplayTime']();

    expect(component.displayTime).toBe('05:30');
  });

  it('should format time correctly - 59 seconds', () => {
    (checkoutService as any).timeRemaining = signal(59);
    fixture.detectChanges();
    component['updateDisplayTime']();

    expect(component.displayTime).toBe('00:59');
  });

  it('should show 00:00 when time expired', () => {
    (checkoutService as any).timeRemaining = signal(0);
    fixture.detectChanges();
    component['updateDisplayTime']();

    expect(component.displayTime).toBe('00:00');
  });
});
