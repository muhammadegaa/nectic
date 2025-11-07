"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Droplet, ArrowLeft, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react"
import Link from "next/link"
import { useCurrency } from "@/lib/currency-context"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/contexts/auth-context"
import { trackEvent } from "@/lib/analytics"
import { reportError } from "@/lib/error-reporting"
import { Button } from "@/components/ui/button"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import CheckoutForm from "./checkout-form"
import { isDemoMode } from "@/lib/demo-mode"

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get("plan")
  const initialEmail = searchParams.get("email")
  const initialName = searchParams.get("name")
  const { formatPrice, isLoading: currencyLoading } = useCurrency()
  const { t, isLoading: languageLoading } = useLanguage()
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [planDetails, setPlanDetails] = useState({ name: "", priceUSD: 0 })
  const [clientSecret, setClientSecret] = useState("")

  const isLoading = currencyLoading || languageLoading || loading

  useEffect(() => {
    if (!plan) {
      return
    }

    trackEvent("checkout_started", {
      plan,
      email: initialEmail || user?.email || undefined,
      userId: user?.uid,
    })
  }, [plan, initialEmail, user?.uid])

  useEffect(() => {
    if (plan === "premium") {
      setPlanDetails({
        name: "Premium Plan",
        priceUSD: 499,
      })
    } else {
      setPlanDetails({
        name: "Standard Plan",
        priceUSD: 249,
      })
    }
  }, [plan])

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    if (plan) {
      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          email: initialEmail || user?.email || "",
          name: initialName || user?.displayName || "",
          userId: user?.uid,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret)
          setLoading(false)
        })
        .catch((err) => {
          console.error("Error:", err)
          reportError(err, { context: "create-payment-intent", plan, userId: user?.uid })
          setError("Failed to initialize payment. Please try again.")
          setLoading(false)
        })
    }
  }, [plan, initialEmail, initialName, user])

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#f59e0b',
    },
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 flex flex-col">
        <header className="w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
          <div className="container flex h-16 items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative w-8 h-8 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20">
                <Droplet className="h-5 w-5 text-primary transition-all duration-300 group-hover:scale-110" />
              </div>
              <span className="inline-block font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-600">
                Nectic
              </span>
            </Link>
          </div>
        </header>
        <div className="container py-12 text-center flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-lg text-gray-600">
              Setting up your payment...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 flex flex-col">
        <header className="w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
          <div className="container flex h-16 items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative w-8 h-8 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20">
                <Droplet className="h-5 w-5 text-primary transition-all duration-300 group-hover:scale-110" />
              </div>
              <span className="inline-block font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-600">
                Nectic
              </span>
            </Link>
          </div>
        </header>
        <div className="container py-12 text-center flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <p className="text-lg text-gray-600 mb-4">
              No plan selected
            </p>
            <Link href="/#pricing">
              <Button className="mt-4">
                Go to Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 flex flex-col">
      <header className="w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative w-8 h-8 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20">
              <Droplet className="h-5 w-5 text-primary transition-all duration-300 group-hover:scale-110" />
            </div>
            <span className="inline-block font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-600">
              Nectic
            </span>
          </Link>
        </div>
      </header>

      <main className="container py-12 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link href="/#pricing" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pricing
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-2xl font-bold mb-6">
              Complete Your Purchase
            </h1>

            <div className="flex items-center justify-between mb-6 pb-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">{planDetails.name}</h2>
                <p className="text-gray-500 mt-1">
                  Monthly subscription
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatPrice(planDetails.priceUSD)}</p>
                <p className="text-gray-500 text-sm">
                  per month
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">
                    Full access to all features
                  </p>
                  <p className="text-gray-500 text-sm">
                    Use all premium features without restrictions
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">
                    Cancel anytime
                  </p>
                  <p className="text-gray-500 text-sm">
                    No long-term commitment required
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">
                    Secure payment
                  </p>
                  <p className="text-gray-500 text-sm">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: appearance as any }}>
                <CheckoutForm
                  clientSecret={clientSecret}
                  plan={plan}
                  initialEmail={initialEmail || user?.email || ""}
                  initialName={initialName || user?.displayName || ""}
                  demoMode={clientSecret.startsWith("demo_")}
                />
              </Elements>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
