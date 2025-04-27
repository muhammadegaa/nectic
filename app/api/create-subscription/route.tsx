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
    const { customerId, plan, paymentMethodId, userId } = await request.json()

    if (!customerId || !plan || !paymentMethodId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use the hardcoded price IDs instead of environment variables
    const priceId = plan === "premium" ? PRICE_IDS.premium : PRICE_IDS.standard

    console.log(`Using price ID: ${priceId} for plan: ${plan}`)

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // Set the payment method as the default for the customer
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
      metadata: {
        userId: userId || "",
        company: "NECTIC",
      },
    })

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        userId: userId || "",
        plan: plan,
        company: "NECTIC",
      },
    })

    // @ts-ignore - Stripe types are not accurate for this nested expansion
    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: clientSecret,
    })
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
