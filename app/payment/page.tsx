"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import CheckoutForm from "../checkout/checkout-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan") || "standard"

  const [clientSecret, setClientSecret] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planPrice, setPlanPrice] = useState(plan === "premium" ? 399 : 199) // Early adopter prices
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Create a temporary customer and setup intent without authentication
    const setupPayment = async () => {
      try {
        setLoading(true)
        setError(null)

        // Create a temporary customer
        const customerResponse = await fetch("/api/create-temp-customer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "",
            name: "",
          }),
        })

        if (!customerResponse.ok) {
          const errorData = await customerResponse.json()
          throw new Error(errorData.error || "Failed to create temporary customer")
        }

        const customerData = await customerResponse.json()
        setCustomerId(customerData.customerId)

        // Create a payment intent
        const paymentResponse = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: customerData.customerId,
            plan: plan,
          }),
        })

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json()
          throw new Error(errorData.error || "Failed to create payment intent")
        }

        const paymentData = await paymentResponse.json()
        setClientSecret(paymentData.clientSecret)
        setPlanPrice(paymentData.planPrice || (plan === "premium" ? 399 : 199)) // Early adopter prices
      } catch (err) {
        console.error("Error setting up payment:", err)
        setError(err instanceof Error ? err.message : "Failed to set up payment")
      } finally {
        setLoading(false)
      }
    }

    setupPayment()
  }, [plan, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const planTitle = plan === "premium" ? "Premium Plan" : "Standard Plan"

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 flex flex-col">
      <header className="w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 container max-w-4xl mx-auto py-12 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Purchase</CardTitle>
            <CardDescription>{planTitle} - Early Adopter Pricing</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-4" />
                <p className="text-gray-600">Setting up payment form...</p>
              </div>
            ) : error ? (
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-700 mb-2">Payment Error</h3>
                <p className="text-gray-600 mb-6">{error}</p>

                <div className="space-y-4">
                  <Button onClick={handleRetry} className="w-full">
                    Try Again
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/">Return to Homepage</Link>
                  </Button>
                </div>
              </div>
            ) : clientSecret && customerId ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#f59e0b",
                    },
                  },
                  loader: "auto",
                  business: { name: "NECTIC" },
                  paymentMethodCreation: "manual", // Add this line to fix the error
                }}
              >
                <CheckoutForm
                  clientSecret={clientSecret}
                  customerId={customerId}
                  plan={plan}
                  initialEmail=""
                  initialName=""
                  planPrice={planPrice}
                />
              </Elements>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
