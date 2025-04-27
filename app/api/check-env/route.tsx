import { NextResponse } from "next/server"

export async function GET() {
  // Only return partial values for security
  return NextResponse.json({
    standardPriceId: process.env.STRIPE_STANDARD_PRICE_ID
      ? `${process.env.STRIPE_STANDARD_PRICE_ID.substring(0, 5)}...`
      : "Not set",
    premiumPriceId: process.env.STRIPE_PREMIUM_PRICE_ID
      ? `${process.env.STRIPE_PREMIUM_PRICE_ID.substring(0, 5)}...`
      : "Not set",
  })
}
