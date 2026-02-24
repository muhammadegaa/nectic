/**
 * Domain Repository Interface: Payment
 * Defines contracts for payment/subscription data operations
 */

import { Subscription, CheckoutSession } from '../entities/payment.entity'

export interface IPaymentRepository {
  findSubscriptionByUserId(userId: string): Promise<Subscription | null>
  findSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null>
  createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription>
  updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription>
  cancelSubscription(subscriptionId: string): Promise<Subscription>
}















