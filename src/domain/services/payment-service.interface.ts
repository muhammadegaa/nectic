/**
 * Domain Service Interface: Payment Service
 * Defines contract for payment processing
 * Implementation lives in infrastructure layer
 */

import { CheckoutSession, SubscriptionTier } from '../entities/payment.entity'

export interface IPaymentService {
  createCheckoutSession(
    userId: string,
    tier: SubscriptionTier,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSession>
  handleWebhookEvent(event: unknown): Promise<void>
  cancelSubscription(stripeSubscriptionId: string): Promise<void>
}















