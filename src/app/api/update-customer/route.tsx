import { NextResponse } from "next/server"
import Stripe from "stripe"

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
    const { customerId, email, name, plan } = body

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Update the customer with email and name
    const updateData: Stripe.CustomerUpdateParams = {}

    if (email && isValidEmail(email)) {
      updateData.email = email
    } else if (email) {
      console.log("Skipping invalid email update:", email)
    }

    if (name) updateData.name = name

    // Only proceed with the update if we have valid data to update
    if (Object.keys(updateData).length > 0 || plan) {
      // Add additional metadata if needed
      updateData.metadata = {
        ...(plan ? { plan } : {}),
        updated_at: new Date().toISOString(),
      }

      const updatedCustomer = await stripe.customers.update(customerId, updateData)

      return NextResponse.json({
        success: true,
        customer: {
          id: updatedCustomer.id,
          email: updatedCustomer.email,
          name: updatedCustomer.name,
        },
      })
    } else {
      // No valid data to update
      return NextResponse.json({
        success: false,
        message: "No valid data to update",
      })
    }
  } catch (error) {
    console.error("Error updating customer:", error)
    return NextResponse.json({ error: "Failed to update customer information" }, { status: 500 })
  }
}
