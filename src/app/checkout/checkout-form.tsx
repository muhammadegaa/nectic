"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics"
import { reportError } from "@/lib/error-reporting"
import { Loader2 } from "lucide-react"

interface CheckoutFormProps {
  clientSecret: string
  plan: string | null
  initialEmail: string
  initialName: string
}

export default function CheckoutForm({
  clientSecret,
  plan,
  initialEmail,
  initialName,
}: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError(null)

    trackEvent("checkout_submit_clicked", {
      plan,
      hasClientSecret: Boolean(clientSecret),
    })

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        trackEvent("checkout_validation_failed", {
          plan,
          message: submitError.message,
        })
        setError(submitError.message || "An error occurred")
        setIsLoading(false)
        return
      }

      trackEvent("checkout_payment_confirmation", { plan })

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      })

      if (confirmError) {
        trackEvent("checkout_confirmation_failed", {
          plan,
          message: confirmError.message,
        })
        setError(confirmError.message || "An error occurred")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Payment error:", err)
      reportError(err, { context: "checkout-confirm", plan })
      trackEvent("checkout_unexpected_error", { plan, message: err instanceof Error ? err.message : String(err) })
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full py-6 text-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>Complete Purchase</>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        By proceeding, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  )
}
