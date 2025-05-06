import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    const { customerId, paymentMethodId, plan, period, email, name, company, returnUrl } = await request.json()

    if (!customerId || !paymentMethodId || !returnUrl) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get the monthly price based on the plan
    const monthlyPrice = plan === "premium" ? 399 : 199 // $399 or $199

    // Calculate the total amount based on the period (in cents)
    const months = period === "12month" ? 12 : 6
    const amount = monthlyPrice * months * 100 // Convert to cents

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

    // Create a payment intent for the full amount with proper configuration
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      return_url: returnUrl, // Include the return URL for redirect flows
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "always",
      },
      metadata: {
        plan: plan || "standard",
        period: period || "6month",
        months: months.toString(),
        monthly_price: monthlyPrice.toString(),
      },
      description: `${plan === "premium" ? "Premium" : "Standard"} Plan - ${months} Months ($${monthlyPrice}/month)`,
    })

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      nextAction: paymentIntent.next_action,
    })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
