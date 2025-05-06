import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    const { customerId, paymentMethodId, plan, period, email, name, company } = await request.json()

    if (!customerId || !paymentMethodId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // Set the payment method as the default
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
      email: email || undefined,
      name: name || undefined,
      metadata: {
        company: company || "",
        plan: plan || "standard",
        period: period || "6month",
      },
    })

    // Determine which price ID to use based on plan and period
    let priceId
    if (plan === "premium") {
      priceId =
        period === "12month"
          ? process.env.NEXT_PUBLIC_STRIPE_PREMIUM_12MONTH_PRICE_ID
          : process.env.NEXT_PUBLIC_STRIPE_PREMIUM_6MONTH_PRICE_ID
    } else {
      priceId =
        period === "12month"
          ? process.env.NEXT_PUBLIC_STRIPE_STANDARD_12MONTH_PRICE_ID
          : process.env.NEXT_PUBLIC_STRIPE_STANDARD_6MONTH_PRICE_ID
    }

    console.log(`Using price ID: ${priceId} for plan: ${plan}, period: ${period}`)

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
        plan: plan || "standard",
        period: period || "6month",
      },
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
