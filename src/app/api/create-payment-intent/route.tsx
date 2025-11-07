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

    // Calculate the price based on the plan
    const amount = plan === "premium" ? 49900 : 24900 // Amount in cents

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        plan,
        userId: userId || "",
      },
      receipt_email: email || undefined,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}