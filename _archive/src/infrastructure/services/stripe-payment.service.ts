/**
 * Infrastructure: Stripe Payment Service
 * Implements IPaymentService using Stripe API
 */

import { IPaymentService } from '@/domain/services/payment-service.interface'
import { CheckoutSession, SubscriptionTier } from '@/domain/entities/payment.entity'
import Stripe from 'stripe'

export class StripePaymentService implements IPaymentService {
  private stripe: Stripe

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-10-29.clover' as any,
    })
  }

  async createCheckoutSession(
    userId: string,
    tier: SubscriptionTier,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSession> {
    const priceId = this.getPriceId(tier)

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
        tier,
      },
    })

    return {
      sessionId: session.id,
      userId,
      tier,
      successUrl,
      cancelUrl,
    }
  }

  async handleWebhookEvent(event: unknown): Promise<void> {
    const stripeEvent = event as Stripe.Event

    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(stripeEvent.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.handleSubscriptionUpdate(stripeEvent.data.object as Stripe.Subscription)
        break
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`)
    }
  }

  async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    })
  }

  private getPriceId(tier: SubscriptionTier): string {
    const priceIds: Record<SubscriptionTier, string> = {
      free: process.env.STRIPE_FREE_PRICE_ID || '',
      premium: process.env.STRIPE_PREMIUM_PRICE_ID || '',
    }

    const priceId = priceIds[tier]
    if (!priceId) {
      throw new Error(`Price ID not configured for tier: ${tier}`)
    }

    return priceId
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    // This will be handled by the webhook route
    // which will update the subscription in the repository
    console.log('Checkout completed:', session.id)
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    // This will be handled by the webhook route
    // which will update the subscription in the repository
    console.log('Subscription updated:', subscription.id)
  }
}





