import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: "Missing customer ID" }, { status: 400 })
    }

    console.log("Creating setup intent for customer:", customerId)

    // Create a SetupIntent for the customer
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
    })

    console.log("Setup intent created with client secret")

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      success: true,
    })
  } catch (error) {
    console.error("Error creating setup intent:", error)
    return NextResponse.json({ error: "Failed to create setup intent" }, { status: 500 })
  }
}
