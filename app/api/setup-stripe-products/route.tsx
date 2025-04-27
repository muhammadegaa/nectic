import { NextResponse } from "next/server"
import Stripe from "stripe"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    // Create Standard Product
    const standardProduct = await stripe.products.create({
      name: "Standard Plan",
      description: "Standard subscription plan",
      active: true,
    })

    // Create Standard Price
    const standardPrice = await stripe.prices.create({
      product: standardProduct.id,
      unit_amount: 4900, // $49.00
      currency: "usd",
      recurring: {
        interval: "month",
      },
      active: true,
    })

    // Create Premium Product
    const premiumProduct = await stripe.products.create({
      name: "Premium Plan",
      description: "Premium subscription plan with additional features",
      active: true,
    })

    // Create Premium Price
    const premiumPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 9900, // $99.00
      currency: "usd",
      recurring: {
        interval: "month",
      },
      active: true,
    })

    return NextResponse.json({
      success: true,
      standardPriceId: standardPrice.id,
      premiumPriceId: premiumPrice.id,
      message: "Stripe products and prices created successfully",
    })
  } catch (error) {
    console.error("Error creating Stripe products:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create Stripe products",
      },
      { status: 500 },
    )
  }
}
