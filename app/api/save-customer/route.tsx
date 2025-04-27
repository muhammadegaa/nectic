import { NextResponse } from "next/server"
import { db } from "@/lib/firebase-client"
import { setDoc, doc, updateDoc, getDoc } from "firebase/firestore"
import Stripe from "stripe"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

// Simple email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return email && emailRegex.test(email)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, email, name, plan, userId } = body

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Save to Firestore
    try {
      // Create a document in the customers collection
      await setDoc(doc(db, "customers", customerId), {
        customerId,
        email: email || "",
        name: name || "",
        plan: plan || "standard",
        createdAt: new Date().toISOString(),
        source: "checkout",
        userId: userId || null, // Link to user if available
      })

      // If we have a userId, update the user document with the Stripe customer ID
      if (userId) {
        const userDoc = await getDoc(doc(db, "users", userId))
        if (userDoc.exists()) {
          await updateDoc(doc(db, "users", userId), {
            "subscription.stripeCustomerId": customerId,
            "subscription.tier": plan || "standard",
          })
        }
      }

      console.log("Customer saved to Firestore:", customerId)
    } catch (firestoreError) {
      console.error("Error saving to Firestore:", firestoreError)
      // Continue execution even if Firestore fails
    }

    // Update Stripe customer if we have a valid email
    if (email && isValidEmail(email)) {
      try {
        const updateData: Stripe.CustomerUpdateParams = {}

        updateData.email = email
        if (name) updateData.name = name

        // Add userId to metadata if available
        updateData.metadata = {
          ...(plan ? { plan } : {}),
          ...(userId ? { userId } : {}),
          updated_at: new Date().toISOString(),
        }

        await stripe.customers.update(customerId, updateData)
        console.log("Customer updated in Stripe:", customerId)
      } catch (stripeError) {
        console.error("Error updating Stripe customer:", stripeError)
        // We already saved to Firestore, so we can still return success
      }
    } else if (email) {
      console.log("Skipping Stripe update due to invalid email:", email)
    }

    return NextResponse.json({
      success: true,
      message: "Customer data saved successfully",
    })
  } catch (error) {
    console.error("Error in save-customer API:", error)
    return NextResponse.json({ error: "Failed to save customer information" }, { status: 500 })
  }
}
