/**
 * API Route: Create Checkout Session
 * Presentation layer - handles HTTP requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { CreateCheckoutSessionUseCase } from '@/application/use-cases/payment/create-checkout-session.use-case'
import { getPaymentService } from '@/infrastructure/di/container'
import { ValidationError } from '@/application/errors/domain-errors'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, tier, successUrl, cancelUrl } = body

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!tier || !['free', 'premium'].includes(tier)) {
      return NextResponse.json(
        { error: 'Valid tier is required (free or premium)' },
        { status: 400 }
      )
    }

    if (tier === 'free') {
      return NextResponse.json(
        { error: 'Free tier does not require checkout' },
        { status: 400 }
      )
    }

    // Initialize use case
    const paymentService = getPaymentService()
    const createCheckoutSession = new CreateCheckoutSessionUseCase(paymentService)

    // Execute use case
    const session = await createCheckoutSession.execute(
      userId,
      tier,
      successUrl || `${request.nextUrl.origin}/checkout/success`,
      cancelUrl || `${request.nextUrl.origin}/checkout/cancel`
    )

    return NextResponse.json({ sessionId: session.sessionId, url: session.successUrl })
  } catch (error) {
    console.error('Error creating checkout session:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





