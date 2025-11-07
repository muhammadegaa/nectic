import { NextResponse } from "next/server"
import Stripe from "stripe"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { plan, email, name, userId } = body

    if (!plan || !["standard", "premium"].includes(plan)) {
      return NextResponse.json({ error: "Valid plan is required" }, { status: 400 })
    }

    // Set the price ID based on the plan
    const priceId = plan === "premium" ? process.env.STRIPE_PREMIUM_PRICE_ID : process.env.STRIPE_STANDARD_PRICE_ID

    if (!priceId) {
      return NextResponse.json({ error: "Price ID not configured" }, { status: 500 })
    }

    // Create a Checkout Session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/#pricing`,
      metadata: {
        plan,
      },
    }

    // Only add customer email if provided
    if (email) {
      sessionConfig.customer_email = email;
    }

    // Only add client_reference_id if userId is provided and not empty
    if (userId) {
      sessionConfig.client_reference_id = userId;
      if (!sessionConfig.metadata) {
        sessionConfig.metadata = {};
      }
      sessionConfig.metadata.userId = userId;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}