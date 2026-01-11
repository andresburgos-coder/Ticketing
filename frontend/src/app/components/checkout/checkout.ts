import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
  private readonly route = inject(ActivatedRoute);

  @ViewChild(ContactForm) contactForm?: ContactForm;
  @ViewChild(PaymentForm) paymentForm?: PaymentForm;

  readonly isLoading = this.checkoutService.isLoading;
  readonly reservation = this.checkoutService.reservation;
  readonly cartItemCount = this.checkoutService.cartItemCount;

  step: 'contact' | 'payment' | 'confirm' = 'contact';
  errors: string[] = [];

  // Store form data between steps
  private contactData?: { firstName: string; lastName: string; email: string; phone: string };
  private paymentData?: { cardNumber: string; expiryDate: string; cvv: string };

  ngOnInit(): void {
    // Check if cart is empty
    if (this.checkoutService.cart().length === 0) {
      this.router.navigate(['/']);
      return;
    }

    // Read event info from query params and set in service
    this.route.queryParams.subscribe(params => {
      const eventId = params['eventId'];
      const eventName = params['eventName'];
      if (eventId) {
        this.checkoutService.setEventInfo(eventId, eventName);
      }
    });
  }

  nextStep(): void {
    this.errors = [];

    if (this.step === 'contact') {
      if (this.contactForm?.validate()) {
        // Store contact data before moving to next step
        this.contactData = this.contactForm.getFormData();
        this.step = 'payment';
      }
    } else if (this.step === 'payment') {
      if (this.paymentForm?.validate()) {
        // Store payment data before confirming
        const formData = this.paymentForm.getFormData();
        this.paymentData = {
          cardNumber: formData.cardNumber,
          expiryDate: formData.expiryDate,
          cvv: formData.cvv
        };
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
    // Use stored data from previous steps
    if (!this.paymentData || !this.contactData) {
      this.errors = ['Missing payment or contact information'];
      return;
    }

    // Save buyer info to localStorage for confirmation page
    const buyerInfo = {
      name: `${this.contactData.firstName} ${this.contactData.lastName}`,
      email: this.contactData.email
    };
    localStorage.setItem('currentBuyerInfo', JSON.stringify(buyerInfo));

    this.checkoutService.confirmOrder('stripe', this.contactData.email, this.paymentData);
    setTimeout(() => {
      const completed = this.checkoutService.completedOrder();
      const ids = completed?.tickets?.map(t => t.id) || [];
      const queryParams: any = {};
      if (ids.length > 0) {
        queryParams.t = ids.join(',');
      }
      this.router.navigate(['/confirmation'], { queryParams });
    }, 1000);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
