import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  IPaymentGateway,
  PaymentResult,
  PaymentData,
} from "../../domain/interfaces/payment-gateway.interface";

/**
 * MockPaymentGateway
 * Simulates a payment gateway for development/testing
 * In production, replace with actual payment processor (Stripe, PayPal, etc.)
 */
@Injectable()
export class MockPaymentGateway implements IPaymentGateway {
  constructor(private readonly configService: ConfigService) {}

  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    // Simulate async payment processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get success rate from environment or default to always succeed in development
    const successRate = parseFloat(
      this.configService.get<string>("MOCK_PAYMENT_SUCCESS_RATE", "1.0"),
    );
    const isSuccessful = Math.random() < successRate;

    console.log(
      `💳 [MockPaymentGateway] Processing payment for ${paymentData.amount.amount} ${paymentData.amount.currency}`,
    );
    console.log(
      `💳 [MockPaymentGateway] Success rate: ${successRate * 100}%, Result: ${isSuccessful ? "SUCCESS" : "FAILED"}`,
    );

    if (isSuccessful) {
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      console.log(
        `✅ [MockPaymentGateway] Payment successful: ${transactionId}`,
      );

      return {
        success: true,
        transactionId,
        processedAt: new Date(),
      };
    } else {
      console.log(`❌ [MockPaymentGateway] Payment failed: PAYMENT_DECLINED`);

      return {
        success: false,
        errorCode: "PAYMENT_DECLINED",
        errorMessage: "Payment was declined by the issuer",
      };
    }
  }

  async refundPayment(transactionId: string): Promise<PaymentResult> {
    // Simulate refund processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log(
      `🔄 [MockPaymentGateway] Processing refund for transaction: ${transactionId}`,
    );

    return {
      success: true,
      transactionId: `REFUND-${transactionId}`,
      processedAt: new Date(),
    };
  }
}
