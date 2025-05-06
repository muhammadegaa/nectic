import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

// Use the original price IDs to create real transactions
const PRICE_IDS = {
  standard: process.env.STRIPE_STANDARD_PRICE_ID || "price_1RHQhvDARABW0ktmXYbDQEAP",
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || "price_1RHQiODARABW0ktmrw5Ens3A",
}

export async function POST(request: Request) {
  try {
    const { customerId, plan } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Determine price based on plan
    const priceId = plan === "premium" ? PRICE_IDS.premium : PRICE_IDS.standard

    console.log(`Using price ID: ${priceId} for plan: ${plan}`)

    // Create a SetupIntent instead of a PaymentIntent for subscriptions
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      metadata: {
        plan: plan || "standard",
        priceId: priceId,
        test: "true", // Mark as test intent
      },
    })

    // Use the real prices for UI display but we'll add a trial period to avoid charges
    const planPrice = plan === "premium" ? 399 : 199

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      planPrice: planPrice,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}
