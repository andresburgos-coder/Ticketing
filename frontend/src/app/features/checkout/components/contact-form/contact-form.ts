import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css'
})
export class ContactForm {
  formData: ContactFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  errors: { [key: string]: string } = {};

  validate(): boolean {
    this.errors = {};

    if (!this.formData.firstName.trim()) {
      this.errors['firstName'] = 'First name is required';
    }
    if (!this.formData.lastName.trim()) {
      this.errors['lastName'] = 'Last name is required';
    }
    if (!this.formData.email.trim()) {
      this.errors['email'] = 'Email is required';
    } else if (!this.isValidEmail(this.formData.email)) {
      this.errors['email'] = 'Invalid email format';
    }
    if (!this.formData.phone.trim()) {
      this.errors['phone'] = 'Phone number is required';
    }

    return Object.keys(this.errors).length === 0;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
