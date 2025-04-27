import { NextResponse } from "next/server"
import Stripe from "stripe"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { plan, email, name } = body

    // Create a customer with email and name if provided
    const customerData: Stripe.CustomerCreateParams = {
      metadata: {
        plan: plan || "standard",
        created_at: new Date().toISOString(),
      },
    }

    // Add email and name if provided
    if (email) customerData.email = email
    if (name) customerData.name = name

    const customer = await stripe.customers.create(customerData)
    console.log(`Created customer: ${customer.id}`)

    // Create a SetupIntent with the right configuration
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      usage: "off_session", // This allows the payment method to be used later
    })

    console.log(`Created setup intent: ${setupIntent.id}`)

    // Return the client secret and customer ID
    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
      plan: plan,
    })
  } catch (error) {
    console.error("Error creating setup intent:", error)
    return NextResponse.json({ error: "Failed to create setup intent" }, { status: 500 })
  }
}
