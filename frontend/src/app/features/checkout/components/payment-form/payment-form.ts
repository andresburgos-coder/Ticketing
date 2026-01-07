import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PaymentFormData {
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.css'
})
export class PaymentForm {
  formData: PaymentFormData = {
    cardholderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  };

  errors: { [key: string]: string } = {};

  validate(): boolean {
    this.errors = {};

    if (!this.formData.cardholderName.trim()) {
      this.errors['cardholderName'] = 'Cardholder name is required';
    }
    if (!this.formData.cardNumber.replace(/\s/g, '')) {
      this.errors['cardNumber'] = 'Card number is required';
    } else if (!/^\d{13,19}$/.test(this.formData.cardNumber.replace(/\s/g, ''))) {
      this.errors['cardNumber'] = 'Invalid card number';
    }
    if (!this.formData.expiryMonth) {
      this.errors['expiryMonth'] = 'Expiry month is required';
    }
    if (!this.formData.expiryYear) {
      this.errors['expiryYear'] = 'Expiry year is required';
    }
    if (!this.formData.cvv) {
      this.errors['cvv'] = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(this.formData.cvv)) {
      this.errors['cvv'] = 'Invalid CVV';
    }

    return Object.keys(this.errors).length === 0;
  }

  formatCardNumber(value: string): void {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
    this.formData.cardNumber = formatted;
  }

  formatCVV(value: string): void {
    this.formData.cvv = value.replace(/\D/g, '').slice(0, 4);
  }
}
