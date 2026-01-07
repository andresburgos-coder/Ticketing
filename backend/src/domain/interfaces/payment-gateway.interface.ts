import { Money } from '../value-objects/money.vo';

/**
 * Payment data required to process a payment
 * Requirements: 4.1, 4.2
 */
export interface PaymentData {
  readonly amount: Money;
  readonly currency: string;
  readonly description: string;
  readonly metadata: Record<string, string>;
}

/**
 * Discriminated union for payment result
 * Ensures type-safe handling of success and failure cases
 * Requirements: 4.2, 4.5
 */
export type PaymentResult =
  | {
      success: true;
      transactionId: string;
      processedAt: Date;
    }
  | {
      success: false;
      errorCode: string;
      errorMessage: string;
    };

/**
 * IPaymentGateway Interface
 * Defines the contract for payment processing
 * Follows Dependency Inversion Principle (DIP)
 * 
 * Requirements: 4.1, 4.2, 4.5
 * - 4.1: Process payment with amount validation
 * - 4.2: Return success/failure result
 * - 4.5: Handle payment failures gracefully
 */
export interface IPaymentGateway {
  /**
   * Processes a payment through the payment gateway
   * @param data - The payment data to process
   * @returns Promise resolving to PaymentResult (success or failure)
   */
  processPayment(data: PaymentData): Promise<PaymentResult>;
}
