import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    const { email, name, plan, period } = await request.json()

    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      email: email || undefined,
      name: name || undefined,
      metadata: {
        plan: plan || "standard",
        period: period || "6month",
      },
    })

    return NextResponse.json({ customerId: customer.id })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
