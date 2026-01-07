import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CheckoutService } from '../../features/checkout/services/checkout.service';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.css'
})
export class Confirmation {
  private readonly checkoutService = inject(CheckoutService);
  private readonly router = inject(Router);

  readonly cartItemCount = this.checkoutService.cartItemCount;
  readonly total = this.checkoutService.total;

  orderId = 'ORD-' + Date.now();
  qrCode = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + this.orderId;

  continueShopping(): void {
    this.checkoutService.clearCart();
    this.router.navigate(['/']);
  }

  downloadTickets(): void {
    // Placeholder for download functionality
    console.log('Downloading tickets...');
  }
}
