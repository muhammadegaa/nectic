import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/firebase-client"
import { doc, setDoc, updateDoc } from "firebase/firestore"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-01-27.acacia",
})

const PLAN_LIMITS: Record<string, { accounts: number; label: string }> = {
  starter: { accounts: 15, label: "Starter" },
  growth: { accounts: 50, label: "Growth" },
  pro: { accounts: Infinity, label: "Pro" },
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.CheckoutSession
        const { userId, plan, billing } = session.metadata ?? {}
        if (!userId || !plan) break

        const limits = PLAN_LIMITS[plan] ?? { accounts: 3, label: "Free" }
        await setDoc(doc(db, "subscriptions", userId), {
          plan,
          billing,
          status: "active",
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          accountLimit: limits.accounts === Infinity ? 9999 : limits.accounts,
          planLabel: limits.label,
          updatedAt: new Date().toISOString(),
        }, { merge: true })
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) break

        await updateDoc(doc(db, "subscriptions", userId), {
          status: sub.status,
          updatedAt: new Date().toISOString(),
        })
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) break

        await updateDoc(doc(db, "subscriptions", userId), {
          plan: "free",
          status: "cancelled",
          accountLimit: 3,
          planLabel: "Free",
          updatedAt: new Date().toISOString(),
        })
        break
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err)
  }

  return NextResponse.json({ received: true })
}
