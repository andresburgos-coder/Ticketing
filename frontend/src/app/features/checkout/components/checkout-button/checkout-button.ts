import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CheckoutService, CartItem } from '../../services/checkout.service';

@Component({
  selector: 'checkout-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout-button.html',
  styleUrl: './checkout-button.css'
})
export class CheckoutButton {
  private readonly checkoutService = inject(CheckoutService);
  private readonly router = inject(Router);

  @Input() items: CartItem[] = [];
  @Input() eventId?: string | number;
  @Input() eventName?: string;
  @Input() disabled: boolean = false;

  goToCheckout(): void {
    // Validate items
    const validItems = (this.items || []).filter(i => i && i.quantity > 0);
    if (validItems.length === 0) {
      alert('Selecciona al menos una entrada');
      return;
    }

    console.log('Starting checkout with items:', validItems);

    // Load items into cart
    this.checkoutService.clearCart();
    for (const item of validItems) {
      this.checkoutService.addToCart(
        item.ticketTypeId,
        item.ticketTypeName,
        item.quantity,
        item.price
      );
    }

    // Save event info for confirmation page
    this.checkoutService.setEventInfo(this.eventId, this.eventName);

    // Navigate to checkout
    this.router.navigate(['/checkout'], {
      queryParams: {
        eventId: this.eventId,
        eventName: this.eventName
      }
    });
  }
}
