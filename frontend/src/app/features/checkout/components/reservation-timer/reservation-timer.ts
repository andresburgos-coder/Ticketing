import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckoutService } from '../../services/checkout.service';

@Component({
  selector: 'app-reservation-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-timer.html',
  styleUrl: './reservation-timer.css'
})
export class ReservationTimer implements OnInit {
  private readonly checkoutService = inject(CheckoutService);

  readonly timeRemaining = this.checkoutService.timeRemaining;
  displayTime = '';

  ngOnInit(): void {
    this.updateDisplayTime();
  }

  private updateDisplayTime(): void {
    const seconds = this.timeRemaining();
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    this.displayTime = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  ngOnChanges(): void {
    this.updateDisplayTime();
  }
}
