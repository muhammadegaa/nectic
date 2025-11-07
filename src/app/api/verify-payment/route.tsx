import { NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/firebase-client"
import { doc, getDoc, updateDoc } from "firebase/firestore"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, userId } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    })

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Get subscription details
    const subscription = session.subscription as Stripe.Subscription
    const customer = session.customer as Stripe.Customer

    if (!subscription) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 })
    }

    // Format the next billing date
    const periodEnd = (subscription as any).current_period_end || (subscription as any).currentPeriodEnd
    const nextBillingDate = new Date(periodEnd * 1000)
    const formattedDate = nextBillingDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Determine the plan name
    let planName = "Standard"
    if (subscription.items.data[0]?.price?.nickname) {
      planName = subscription.items.data[0].price.nickname
    } else if (subscription.items.data[0]?.price?.unit_amount) {
      // Determine plan based on price
      if (subscription.items.data[0].price.unit_amount >= 49900) {
        planName = "Premium"
      } else {
        planName = "Standard"
      }
    }

    // If we have a userId, update the user document in Firestore
    if (userId) {
      try {
        const userDocRef = doc(db, "users", userId)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          await updateDoc(userDocRef, {
            "subscription.status": subscription.status,
            "subscription.plan": planName,
            "subscription.subscriptionId": subscription.id,
            "subscription.customerId": customer.id,
            "subscription.currentPeriodEnd": new Date(periodEnd * 1000).toISOString(),
            "subscription.updatedAt": new Date().toISOString(),
          })
        }
      } catch (firestoreError) {
        console.error("Error updating user document:", firestoreError)
        // Continue even if Firestore update fails
      }
    }

    // Return subscription details
    return NextResponse.json({
      success: true,
      plan: planName,
      status: subscription.status,
      nextBillingDate: formattedDate,
      subscriptionId: subscription.id,
      customerId: customer.id,
    })
  } catch (error) {
    console.error("Error verifying payment:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}