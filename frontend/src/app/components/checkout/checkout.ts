import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CheckoutService } from '../../features/checkout/services/checkout.service';
import { OrderSummary } from '../../features/checkout/components/order-summary/order-summary';
import { ReservationTimer } from '../../features/checkout/components/reservation-timer/reservation-timer';
import { ContactForm } from '../../features/checkout/components/contact-form/contact-form';
import { PaymentForm } from '../../features/checkout/components/payment-form/payment-form';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    OrderSummary,
    ReservationTimer,
    ContactForm,
    PaymentForm,
    LoadingSpinner
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit, OnDestroy {
  private readonly checkoutService = inject(CheckoutService);
  private readonly router = inject(Router);

  @ViewChild(ContactForm) contactForm?: ContactForm;
  @ViewChild(PaymentForm) paymentForm?: PaymentForm;

  readonly isLoading = this.checkoutService.isLoading;
  readonly reservation = this.checkoutService.reservation;
  readonly cartItemCount = this.checkoutService.cartItemCount;

  step: 'contact' | 'payment' | 'confirm' = 'contact';
  errors: string[] = [];

  ngOnInit(): void {
    // Check if cart is empty
    if (this.checkoutService.cart().length === 0) {
      this.router.navigate(['/']);
    }
  }

  nextStep(): void {
    this.errors = [];

    if (this.step === 'contact') {
      if (this.contactForm?.validate()) {
        this.step = 'payment';
      }
    } else if (this.step === 'payment') {
      if (this.paymentForm?.validate()) {
        this.confirmOrder();
      }
    }
  }

  previousStep(): void {
    if (this.step === 'payment') {
      this.step = 'contact';
    }
  }

  confirmOrder(): void {
    this.checkoutService.confirmOrder('stripe');
    setTimeout(() => {
      this.router.navigate(['/confirmation']);
    }, 1000);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
