import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-form-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-error.html',
  styleUrl: './form-error.css'
})
export class FormError {
  @Input() errors: ValidationErrors | null = null;
  @Input() fieldName = 'This field';

  getErrorMessage(): string {
    if (!this.errors) return '';

    if (this.errors['required']) {
      return `${this.fieldName} is required.`;
    }
    if (this.errors['email']) {
      return 'Please enter a valid email address.';
    }
    if (this.errors['minlength']) {
      const minLength = this.errors['minlength'].requiredLength;
      return `${this.fieldName} must be at least ${minLength} characters.`;
    }
    if (this.errors['maxlength']) {
      const maxLength = this.errors['maxlength'].requiredLength;
      return `${this.fieldName} must not exceed ${maxLength} characters.`;
    }
    if (this.errors['pattern']) {
      return `${this.fieldName} format is invalid.`;
    }
    if (this.errors['min']) {
      return `${this.fieldName} must be at least ${this.errors['min'].min}.`;
    }
    if (this.errors['max']) {
      return `${this.fieldName} must not exceed ${this.errors['max'].max}.`;
    }

    return 'Invalid input.';
  }
}
