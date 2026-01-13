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
  styleUrl: './contact-form.css',
})
export class ContactForm {
  formData: ContactFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  };

  errors: { [key: string]: string } = {};

  validate(): boolean {
    this.errors = {};

    if (!this.formData.firstName.trim()) {
      this.errors['firstName'] = 'El nombre es obligatorio';
    }
    if (!this.formData.lastName.trim()) {
      this.errors['lastName'] = 'El apellido es obligatorio';
    }
    if (!this.formData.email.trim()) {
      this.errors['email'] = 'El correo es obligatorio';
    } else if (!this.isValidEmail(this.formData.email)) {
      this.errors['email'] = 'Formato de correo inválido';
    }
    if (!this.formData.phone.trim()) {
      this.errors['phone'] = 'El teléfono es obligatorio';
    }

    return Object.keys(this.errors).length === 0;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getFormData(): ContactFormData {
    return { ...this.formData };
  }
}
