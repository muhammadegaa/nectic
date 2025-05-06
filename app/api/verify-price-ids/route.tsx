import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

// Price IDs for all plan and period combinations
const PRICE_IDS = {
  standard: {
    "6month": "price_1RJXTFDARABW0ktmtFsZKae6",
    "12month": "price_1RJXUkDARABW0ktm39r1XKWu",
  },
  premium: {
    "6month": "price_1RJXTeDARABW0ktm3nXbzKsu",
    "12month": "price_1RJXTqDARABW0ktmZdMOhtq8",
  },
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const plan = url.searchParams.get("plan") || "standard"
    const period = url.searchParams.get("period") || "6month"

    if (!["standard", "premium"].includes(plan)) {
      return NextResponse.json({ success: false, error: "Invalid plan" }, { status: 400 })
    }

    if (!["6month", "12month"].includes(period)) {
      return NextResponse.json({ success: false, error: "Invalid period" }, { status: 400 })
    }

    // Get the correct price ID
    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS][period as keyof typeof PRICE_IDS.standard]

    // Retrieve the price from Stripe to verify its configuration
    const price = await stripe.prices.retrieve(priceId)

    // Verify the price has the correct billing interval
    const isCorrectInterval =
      price.recurring?.interval === "month" &&
      ((period === "6month" && price.recurring.interval_count === 6) ||
        (period === "12month" && price.recurring.interval_count === 12))

    if (!isCorrectInterval) {
      console.error(`Price ${priceId} does not have the correct billing interval for ${period}`)

      // Return the price details for debugging
      return NextResponse.json({
        success: false,
        error: "Price does not have the correct billing interval",
        priceDetails: {
          id: price.id,
          interval: price.recurring?.interval,
          interval_count: price.recurring?.interval_count,
          unit_amount: price.unit_amount,
        },
      })
    }

    return NextResponse.json({
      success: true,
      priceId,
      priceDetails: {
        id: price.id,
        interval: price.recurring?.interval,
        interval_count: price.recurring?.interval_count,
        unit_amount: price.unit_amount,
      },
    })
  } catch (error) {
    console.error("Error verifying price IDs:", error)
    return NextResponse.json({ success: false, error: "Failed to verify price IDs" }, { status: 500 })
  }
}
