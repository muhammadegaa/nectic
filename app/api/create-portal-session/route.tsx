import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
      // Configure available features in the portal
      configuration: {
        features: {
          subscription_cancel: {
            enabled: true,
            cancellation_reason: {
              enabled: true,
            },
          },
          subscription_pause: {
            enabled: true,
          },
          payment_method_update: {
            enabled: true,
          },
          invoice_history: {
            enabled: true,
          },
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Error creating portal session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
