import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-10-29.clover",
})

const PRICE_IDS: Record<string, string> = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
  starter_annual: process.env.STRIPE_PRICE_STARTER_ANNUAL ?? "",
  growth_monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY ?? "",
  growth_annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL ?? "",
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
  pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "",
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
    }

    const { plan, billing, userId, email } = await req.json() as {
      plan: string
      billing: "monthly" | "annual"
      userId: string
      email: string
    }

    const priceKey = `${plan}_${billing}`
    const priceId = PRICE_IDS[priceKey]

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const origin = req.headers.get("origin") ?? "https://nectic.vercel.app"

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, plan, billing },
      success_url: `${origin}/concept?checkout=success&plan=${plan}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      subscription_data: {
        metadata: { userId, plan, billing },
        trial_period_days: 14,
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Stripe checkout error:", err)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
