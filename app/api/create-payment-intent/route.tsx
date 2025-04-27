import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

// Hardcoded price IDs as provided
const PRICE_IDS = {
  standard: "price_1RHRdLDARABW0ktm7fe2Xppc",
  premium: "price_1RHQiODARABW0ktmrw5Ens3A",
}

export async function POST(request: Request) {
  try {
    const { customerId, plan } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Determine price based on plan
    const planPrice = plan === "premium" ? 399 : 199

    // Create a SetupIntent instead of a PaymentIntent for subscriptions
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      metadata: {
        plan: plan || "standard",
        priceId: plan === "premium" ? PRICE_IDS.premium : PRICE_IDS.standard,
      },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      planPrice: planPrice,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}
