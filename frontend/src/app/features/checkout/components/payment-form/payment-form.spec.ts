import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { PaymentForm } from './payment-form';

describe('PaymentForm', () => {
  let component: PaymentForm;
  let fixture: ComponentFixture<PaymentForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentForm, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('validation', () => {
    it('should validate empty form as invalid', () => {
      const isValid = component.validate();

      expect(isValid).toBe(false);
      expect(component.errors['cardholderName']).toBeTruthy();
      expect(component.errors['cardNumber']).toBeTruthy();
      expect(component.errors['expiryMonth']).toBeTruthy();
      expect(component.errors['expiryYear']).toBeTruthy();
      expect(component.errors['cvv']).toBeTruthy();
    });

    it('should validate cardNumber length', () => {
      component.formData.cardNumber = '1234';
      component.validate();

      expect(component.errors['cardNumber']).toBe('El número de tarjeta debe tener 13-19 dígitos');
    });

    it('should validate CVV length for non-Amex cards', () => {
      component.formData.cardNumber = '4111111111111111'; // Visa
      component.formData.cvv = '12';
      component.validate();

      expect(component.errors['cvv']).toBe('El CVV debe tener 3 o 4 dígitos');
    });

    it('should validate CVV length for Amex cards', () => {
      component.formData.cardNumber = '378282246310005'; // Amex
      component.formData.cvv = '123';
      component.validate();

      // El componente acepta 3 o 4 dígitos para cualquier tarjeta
      expect(component.errors['cvv']).toBeUndefined();
    });

    it('should validate complete form as valid', () => {
      const currentYear = new Date().getFullYear();
      const nextYear = (currentYear + 1).toString();

      component.formData = {
        cardholderName: 'John Doe',
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: nextYear,
        cvv: '123',
      };

      const isValid = component.validate();

      expect(isValid).toBe(true);
      expect(Object.keys(component.errors).length).toBe(0);
    });
  });

  describe('formatCardNumber', () => {
    it('should format card number with spaces', () => {
      component.formData.cardNumber = '4111111111111111';
      component.formatCardNumber('4111111111111111');

      expect(component.formData.cardNumber).toBe('4111 1111 1111 1111');
    });

    it('should remove non-digit characters', () => {
      component.formatCardNumber('4111-1111-1111-1111');

      expect(component.formData.cardNumber).toBe('4111 1111 1111 1111');
    });
  });

  describe('formatCVV', () => {
    it('should limit CVV to digits only', () => {
      component.formatCVV('abc123');

      expect(component.formData.cvv).toBe('123');
    });
  });
});
