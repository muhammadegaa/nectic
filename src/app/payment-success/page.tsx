"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Droplet, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/contexts/auth-context"

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")
  const { t, isLoading: languageLoading } = useLanguage()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [subscriptionDetails, setSubscriptionDetails] = useState({
    plan: "",
    status: "",
    nextBillingDate: ""
  })

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true)

        // Verify the payment with our backend
        const response = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            userId: user?.uid,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to verify payment")
        }

        const data = await response.json()
        setSubscriptionDetails({
          plan: data.plan || "Standard",
          status: data.status || "active",
          nextBillingDate: data.nextBillingDate || "30 days from now"
        })

        setLoading(false)
      } catch (err) {
        console.error("Error verifying payment:", err)
        setError("We couldn't verify your payment. Please contact support if you believe this is an error.")
        setLoading(false)
      }
    }

    if (sessionId) {
      verifyPayment()
    } else {
      setLoading(false)
    }
  }, [sessionId, user])

  if (loading) {
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
              {languageLoading ? "Verifying your payment..." : "Verifying your payment..."}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {languageLoading ? "This will only take a moment" : "This will only take a moment"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
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
          <div className="bg-red-50 p-8 rounded-lg max-w-md w-full shadow-sm">
            <div className="flex-shrink-0 rounded-full p-2 bg-red-100 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-red-600"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Payment Verification Error</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-amber-600 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Return to Homepage
              </button>
            </div>
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
      <div className="container py-12 flex-1 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg max-w-md w-full shadow-sm">
          <div className="flex-shrink-0 rounded-full p-2 bg-green-100 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Payment Successful!</h2>
          <p className="text-gray-600 text-center mb-6">
            Thank you for subscribing to Nectic. Your payment has been processed successfully.
          </p>

          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Subscription Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{subscriptionDetails.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">{subscriptionDetails.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next billing date:</span>
                <span className="font-medium">{subscriptionDetails.nextBillingDate}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-md mb-6 text-sm">
            <h3 className="font-medium text-amber-800 mb-1">Refund Policy</h3>
            <p className="text-amber-700">
              If you're not satisfied with our service, we offer a 14-day money-back guarantee.
              Contact our support team within 14 days of your purchase for a full refund.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-amber-600 transition-colors text-center"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


function PaymentSuccessFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600">Preparing your payment details...</p>
      </div>
    </div>
  )
}
