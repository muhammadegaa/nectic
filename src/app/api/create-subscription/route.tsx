import { NextResponse } from "next/server"
import Stripe from "stripe"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase-client"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, plan, customerId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!plan || !["standard", "premium"].includes(plan)) {
      return NextResponse.json({ error: "Valid plan is required" }, { status: 400 })
    }

    // Get user document
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get or create Stripe customer
    let stripeCustomerId = customerId
    if (!stripeCustomerId) {
      const userData = userDoc.data()
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.displayName || undefined,
        metadata: {
          userId,
        },
      })
      stripeCustomerId = customer.id
    }

    // Set the price ID based on the plan
    const priceId = plan === "premium" ? process.env.STRIPE_PREMIUM_PRICE_ID : process.env.STRIPE_STANDARD_PRICE_ID

    if (!priceId) {
      return NextResponse.json({ error: "Price ID not configured" }, { status: 500 })
    }

    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    })

    // Update user document with subscription info
    await updateDoc(doc(db, "users", userId), {
      "subscription.stripeCustomerId": stripeCustomerId,
      "subscription.stripeSubscriptionId": subscription.id,
      "subscription.tier": plan,
      "subscription.status": subscription.status,
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret,
      customerId: stripeCustomerId,
    })
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
