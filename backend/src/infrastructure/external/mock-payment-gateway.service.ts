import { Injectable } from '@nestjs/common';
import {
  IPaymentGateway,
  PaymentResult,
  PaymentData,
} from '../../domain/interfaces/payment-gateway.interface';

/**
 * MockPaymentGateway
 * Simulates a payment gateway for development/testing
 * In production, replace with actual payment processor (Stripe, PayPal, etc.)
 */
@Injectable()
export class MockPaymentGateway implements IPaymentGateway {
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    // Simulate async payment processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate 95% success rate
    const isSuccessful = Math.random() > 0.05;

    if (isSuccessful) {
      return {
        success: true,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        processedAt: new Date(),
      };
    } else {
      return {
        success: false,
        errorCode: 'PAYMENT_DECLINED',
        errorMessage: 'Payment was declined by the issuer',
      };
    }
  }

  async refundPayment(transactionId: string): Promise<PaymentResult> {
    // Simulate refund processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      transactionId: `REFUND-${transactionId}`,
      processedAt: new Date(),
    };
  }
}
