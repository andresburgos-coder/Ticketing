import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckoutService } from '../../services/checkout.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-reservation-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-timer.html',
  styleUrl: './reservation-timer.css',
})
export class ReservationTimer implements OnInit, OnDestroy {
  private readonly checkoutService = inject(CheckoutService);
  private readonly cdr = inject(ChangeDetectorRef);
  private timerSubscription?: Subscription;

  displayTime = '15:00';
  isExpired = false;

  ngOnInit(): void {
    // Initial update
    this.updateDisplayTime();

    // Update every second using RxJS interval
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateDisplayTime();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
  }

  private updateDisplayTime(): void {
    const seconds = this.checkoutService.timeRemaining();
    if (seconds <= 0) {
      this.displayTime = '00:00';
      this.isExpired = true;
    } else {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      this.displayTime = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      this.isExpired = false;
    }
  }
}
