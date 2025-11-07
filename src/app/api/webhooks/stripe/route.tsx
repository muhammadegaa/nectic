import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase-client"
import { Timestamp } from "firebase/firestore"

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
})

// This is your Stripe webhook secret for verifying signatures
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get("stripe-signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret!)
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed:`, err)
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }

  // Handle the event
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancelled(deletedSubscription)
        break

      case "invoice.payment_succeeded":
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription
        if (subscriptionId) {
          await handleInvoicePaid(invoice)
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error)
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Get the plan from the subscription
  const planId = subscription.items.data[0].price.id
  let tier: "standard" | "premium" = "standard"

  // Determine tier based on price ID
  if (planId === process.env.STRIPE_PREMIUM_PRICE_ID) {
    tier = "premium"
  }

  try {
    // Find the user with this Stripe customer ID
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("subscription.stripeCustomerId", "==", customerId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // Update the user's subscription
      const userDoc = querySnapshot.docs[0]
      await updateDoc(doc(db, "users", userDoc.id), {
        "subscription.tier": tier,
        "subscription.stripeSubscriptionId": subscription.id,
        "subscription.status": subscription.status,
        "subscription.currentPeriodEnd": Timestamp.fromMillis(((subscription as any).current_period_end || 0) * 1000),
        "subscription.cancelAtPeriodEnd": (subscription as any).cancel_at_period_end || false,
      })

      console.log(`Updated subscription for user ${userDoc.id} to ${tier}`)
    } else {
      console.log(`No user found with Stripe customer ID: ${customerId}`)
    }
  } catch (error) {
    console.error("Error updating subscription:", error)
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  try {
    // Find the user with this Stripe customer ID
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("subscription.stripeCustomerId", "==", customerId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // Update the user's subscription
      const userDoc = querySnapshot.docs[0]
      await updateDoc(doc(db, "users", userDoc.id), {
        "subscription.tier": "free",
        "subscription.status": "canceled",
        "subscription.cancelAtPeriodEnd": false,
      })

      console.log(`Subscription cancelled for user ${userDoc.id}`)
    }
  } catch (error) {
    console.error("Error cancelling subscription:", error)
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription
  if (subscriptionId && invoice.customer) {
    const customerId = invoice.customer as string

    try {
      // Find the user with this Stripe customer ID
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("subscription.stripeCustomerId", "==", customerId))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        // Update the user's payment date
        const userDoc = querySnapshot.docs[0]
        await updateDoc(doc(db, "users", userDoc.id), {
          "subscription.lastPaymentDate": Timestamp.fromMillis(invoice.created * 1000),
        })

        console.log(`Updated payment date for user ${userDoc.id}`)
      }
    } catch (error) {
      console.error("Error updating payment date:", error)
    }
  }
}
