import { NextResponse } from "next/server"
import Stripe from "stripe"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, preferences } = body

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Update Stripe customer metadata with email preferences
    await stripe.customers.update(customerId, {
      metadata: {
        email_preferences: JSON.stringify(preferences),
        updated_at: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Email preferences updated successfully",
    })
  } catch (error) {
    console.error("Error updating email preferences:", error)
    return NextResponse.json({ error: "Failed to update email preferences" }, { status: 500 })
  }
}
