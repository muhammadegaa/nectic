"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import CheckoutForm from "../checkout/checkout-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get("plan") || "standard"
  const period = searchParams.get("period") || "6month"

  const [clientSecret, setClientSecret] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Get the monthly price based on the plan
  const getMonthlyPrice = () => {
    return plan === "premium" ? 399 : 199
  }

  // Calculate the total price based on the period
  const getTotalPrice = () => {
    const monthlyPrice = getMonthlyPrice()
    const months = period === "12month" ? 12 : 6
    return monthlyPrice * months
  }

  const monthlyPrice = getMonthlyPrice()
  const totalPrice = getTotalPrice()

  useEffect(() => {
    // Validate plan and period
    if (!plan || !["standard", "premium"].includes(plan)) {
      router.push("/pricing")
      return
    }

    if (!period || !["6month", "12month"].includes(period)) {
      router.push(`/payment?plan=${plan}&period=6month`)
      return
    }

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
            plan,
            period,
          }),
        })

        if (!customerResponse.ok) {
          const errorData = await customerResponse.json()
          throw new Error(errorData.error || "Failed to create temporary customer")
        }

        const customerData = await customerResponse.json()
        setCustomerId(customerData.customerId)

        // Create a setup intent
        const setupResponse = await fetch("/api/create-setup-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: customerData.customerId,
          }),
        })

        if (!setupResponse.ok) {
          const errorData = await setupResponse.json()
          throw new Error(errorData.error || "Failed to create setup intent")
        }

        const setupData = await setupResponse.json()
        setClientSecret(setupData.clientSecret)
      } catch (err) {
        console.error("Error setting up payment:", err)
        setError(err instanceof Error ? err.message : "Failed to set up payment")
      } finally {
        setLoading(false)
      }
    }

    setupPayment()
  }, [plan, period, retryCount, router])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const planTitle = plan === "premium" ? "Premium Plan" : "Standard Plan"
  const periodTitle = period === "6month" ? "6 Months" : "12 Months"

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 flex flex-col">
      <header className="w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <Link href="/" className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 container max-w-4xl mx-auto py-6 md:py-12 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl md:text-2xl">Complete Your Purchase</CardTitle>
            <CardDescription className="text-sm md:text-base">
              {planTitle} - ${monthlyPrice}/month for {periodTitle}
            </CardDescription>
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
                  paymentMethodCreation: "manual",
                }}
              >
                <CheckoutForm clientSecret={clientSecret} customerId={customerId} plan={plan} period={period} />
              </Elements>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
