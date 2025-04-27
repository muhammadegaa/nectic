import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/firebase-client"
import { doc, getDoc } from "firebase/firestore"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function POST(request: NextRequest) {
  const { plan, email, name, productName, userId } = await request.json()

  if (!email || !name || !productName) {
    return NextResponse.json({ error: "Email, name, and product name are required" }, { status: 400 })
  }

  try {
    // If userId is provided, get user data from Firestore
    let userData = null
    if (userId) {
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        userData = userDoc.data()
      }
    }

    // Check if customer exists in Stripe
    let customer
    if (userId && userData?.subscription?.stripeCustomerId) {
      // If user has a Stripe customer ID, use that
      customer = await stripe.customers.retrieve(userData.subscription.stripeCustomerId)

      // Update customer data if needed
      if (customer && !customer.deleted) {
        await stripe.customers.update(customer.id, {
          email: email || customer.email,
          name: name || customer.name,
          metadata: {
            ...customer.metadata,
            userId: userId,
            plan: plan || customer.metadata.plan || "standard",
          },
        })
      } else {
        // Customer was deleted, create a new one
        customer = null
      }
    }

    // If no customer found, check by email
    if (!customer) {
      const customers = await stripe.customers.list({ email })
      customer = customers.data[0]
    }

    // If still no customer, create a new one
    if (!customer) {
      customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          plan: plan || "standard",
          userId: userId || "anonymous",
        },
      })
    }

    // Create a SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      usage: "off_session",
      setup_future_usage: "off_session",
      statement_descriptor: productName.slice(0, 22),
      description: `${productName} ${plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Standard"} Plan`,
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
      plan: plan || "standard",
    })
  } catch (error) {
    console.error("Error creating setup intent:", error)
    return NextResponse.json({ error: "Failed to create setup intent" }, { status: 500 })
  }
}
