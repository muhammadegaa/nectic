import { NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/firebase-client"
import { doc, updateDoc, getDoc } from "firebase/firestore"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
})

// Simple email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return !!email && emailRegex.test(email)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, setupIntentId, paymentMethodId, email, name, userId } = body

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Log the successful setup
    console.log(`Setup successful for customer ${customerId}`)

    // Update Firestore with setup success
    try {
      const updateData: any = {
        setupComplete: true,
        setupIntentId: setupIntentId || null,
        paymentMethodId: paymentMethodId || null,
        updatedAt: new Date().toISOString(),
      }

      // Add email and name if they exist
      if (email) updateData.email = email
      if (name) updateData.name = name

      await updateDoc(doc(db, "customers", customerId), updateData)
      console.log(`Updated Firestore for customer ${customerId}`)

      // If we have a userId, update the user document as well
      if (userId) {
        const userDoc = await getDoc(doc(db, "users", userId))
        if (userDoc.exists()) {
          await updateDoc(doc(db, "users", userId), {
            "subscription.paymentMethodId": paymentMethodId || null,
            "subscription.setupComplete": true,
          })
          console.log(`Updated user ${userId} with payment method`)
        }
      }
    } catch (firestoreError) {
      console.error("Error updating Firestore:", firestoreError)
      // Continue even if Firestore fails
    }

    // If we have a payment method ID, we can set it as the default payment method
    if (paymentMethodId) {
      const stripeUpdateData: Stripe.CustomerUpdateParams = {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      }

      // Only add email if it's valid
      if (email && isValidEmail(email)) {
        stripeUpdateData.email = email
      }

      // Add name if it exists
      if (name) {
        stripeUpdateData.name = name
      }

      // Add userId to metadata if available
      if (userId) {
        stripeUpdateData.metadata = {
          ...stripeUpdateData.metadata,
          userId,
        }
      }

      await stripe.customers.update(customerId, stripeUpdateData)
      console.log(`Set default payment method ${paymentMethodId} for customer ${customerId}`)
    }

    return NextResponse.json({
      success: true,
      message: "Setup completed successfully",
    })
  } catch (error) {
    console.error("Error processing successful setup:", error)
    return NextResponse.json({ error: "Failed to process setup completion" }, { status: 500 })
  }
}
