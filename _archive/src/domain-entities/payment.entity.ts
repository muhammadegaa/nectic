/**
 * Domain Entity: Payment
 * Core business entities for payments and subscriptions
 */

export type SubscriptionTier = 'free' | 'premium'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

export interface Subscription {
  id: string
  userId: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  stripeSubscriptionId?: string
  stripeCustomerId?: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CheckoutSession {
  sessionId: string
  userId: string
  tier: SubscriptionTier
  successUrl: string
  cancelUrl: string
}















