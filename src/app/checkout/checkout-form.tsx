"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
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

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || "An error occurred")
        setIsLoading(false)
        return
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      })

      if (confirmError) {
        setError(confirmError.message || "An error occurred")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Payment error:", err)
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
