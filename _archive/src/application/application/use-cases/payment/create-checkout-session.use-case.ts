/**
 * Use Case: Create Checkout Session
 * Orchestrates Stripe checkout session creation
 */

import { IPaymentService } from '@/domain/services/payment-service.interface'
import { CheckoutSession } from '@/domain/entities/payment.entity'
import { SubscriptionTier } from '@/domain/entities/payment.entity'

export class CreateCheckoutSessionUseCase {
  constructor(private paymentService: IPaymentService) {}

  async execute(
    userId: string,
    tier: SubscriptionTier,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSession> {
    return this.paymentService.createCheckoutSession(
      userId,
      tier,
      successUrl,
      cancelUrl
    )
  }
}















