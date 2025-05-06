"use client"

import { useState, useEffect } from "react"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import CheckoutForm from "@/app/checkout/checkout-form"

// Load Stripe outside of component render to avoid recreating the Stripe object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function PaymentForm({
  clientSecret,
  customerId,
  plan,
  period = "6month",
}: {
  clientSecret: string
  customerId: string
  plan: string
  period?: string
}) {
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering Stripe Elements
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: "#f59e0b",
      colorBackground: "#ffffff",
      colorText: "#30313d",
      colorDanger: "#df1b41",
      fontFamily: "Inter, system-ui, sans-serif",
      spacingUnit: "4px",
      borderRadius: "8px",
    },
  }

  const options = {
    clientSecret,
    appearance,
    paymentMethodCreation: "manual" as const,
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm clientSecret={clientSecret} customerId={customerId} plan={plan} />
    </Elements>
  )
}
