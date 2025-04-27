import { NextResponse } from "next/server"
import Stripe from "stripe"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get("id")

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 })
    }

    // Fetch the subscription with expanded price data
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price", "latest_invoice"],
    })

    // Get the plan name from the first item's price product
    const price = subscription.items.data[0].price as Stripe.Price
    const product = price.product as string

    // Fetch the product to get its name
    const productDetails = await stripe.products.retrieve(product)

    // Get the plan type from the product metadata or name
    const planType =
      productDetails.metadata.plan_type ||
      (productDetails.name.toLowerCase().includes("premium") ? "premium" : "standard")

    // Get the amount from the price
    const amount = price.unit_amount ? price.unit_amount / 100 : 0

    // Return the subscription details
    return NextResponse.json({
      plan: planType,
      status: subscription.status,
      amount: amount,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    })
  } catch (error) {
    console.error("Error fetching subscription details:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch subscription details" },
      { status: 500 },
    )
  }
}
