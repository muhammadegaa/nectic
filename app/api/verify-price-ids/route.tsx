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

export async function GET() {
  try {
    // Verify the standard price ID
    const standardPrice = await stripe.prices.retrieve(PRICE_IDS.standard)

    // Verify the premium price ID
    const premiumPrice = await stripe.prices.retrieve(PRICE_IDS.premium)

    return NextResponse.json({
      success: true,
      standard: {
        id: standardPrice.id,
        amount: standardPrice.unit_amount ? standardPrice.unit_amount / 100 : 0,
        currency: standardPrice.currency,
        product: standardPrice.product,
      },
      premium: {
        id: premiumPrice.id,
        amount: premiumPrice.unit_amount ? premiumPrice.unit_amount / 100 : 0,
        currency: premiumPrice.currency,
        product: premiumPrice.product,
      },
    })
  } catch (error) {
    console.error("Error verifying price IDs:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to verify price IDs",
      },
      { status: 500 },
    )
  }
}
