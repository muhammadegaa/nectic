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

export async function GET() {
  try {
    const results = []

    // Check each price ID
    for (const plan of ["standard", "premium"]) {
      for (const period of ["6month", "12month"]) {
        const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS][period as keyof typeof PRICE_IDS.standard]

        try {
          const price = await stripe.prices.retrieve(priceId)

          results.push({
            plan,
            period,
            priceId,
            exists: true,
            details: {
              unit_amount: price.unit_amount,
              currency: price.currency,
              interval: price.recurring?.interval,
              interval_count: price.recurring?.interval_count,
            },
          })
        } catch (error) {
          results.push({
            plan,
            period,
            priceId,
            exists: false,
            error: (error as Error).message,
          })
        }
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error checking Stripe prices:", error)
    return NextResponse.json({ error: "Failed to check Stripe prices" }, { status: 500 })
  }
}
