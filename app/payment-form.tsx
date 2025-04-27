"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function PaymentForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [priceId, setPriceId] = useState("")
  const [priceDetails, setPriceDetails] = useState<any>(null)

  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan") || "standard"

  useEffect(() => {
    // Fetch the price ID based on the plan
    const fetchPriceId = async () => {
      try {
        const response = await fetch(`/api/verify-price-ids?plan=${plan}`)
        const data = await response.json()

        if (data.priceId) {
          setPriceId(data.priceId)
          setPriceDetails(data.priceDetails)
        } else {
          setError("Invalid plan selected. Please try again.")
        }
      } catch (error) {
        console.error("Error fetching price ID:", error)
        setError("Failed to load pricing information. Please try again.")
      }
    }

    fetchPriceId()
  }, [plan])

  useEffect(() => {
    // Create a payment intent when the component mounts
    if (priceId) {
      const createPaymentIntent = async () => {
        try {
          setLoading(true)
          const response = await fetch("/api/create-payment-intent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              priceId,
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to create payment intent")
          }

          const data = await response.json()
          setClientSecret(data.clientSecret)
        } catch (error) {
          console.error("Error creating payment intent:", error)
          setError("Failed to initialize payment. Please try again.")
        } finally {
          setLoading(false)
        }
      }

      createPaymentIntent()
    }
  }, [priceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError("Card element not found. Please refresh and try again.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create a temporary customer
      const customerResponse = await fetch("/api/create-temp-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
          company,
        }),
      })

      if (!customerResponse.ok) {
        throw new Error("Failed to create customer")
      }

      const { customerId } = await customerResponse.json()

      // Confirm the payment with the customer ID
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name,
            email,
          },
        },
        receipt_email: email,
      })

      if (stripeError) {
        throw new Error(stripeError.message || "Payment failed. Please try again.")
      }

      if (paymentIntent.status === "succeeded") {
        // Create the subscription
        const subscriptionResponse = await fetch("/api/create-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId,
            priceId,
            paymentMethodId: paymentIntent.payment_method,
            email,
            name,
            company,
          }),
        })

        if (!subscriptionResponse.ok) {
          throw new Error("Payment succeeded but subscription creation failed. Our team will contact you.")
        }

        const { subscriptionId } = await subscriptionResponse.json()

        // Save the customer details
        await fetch("/api/save-customer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId,
            subscriptionId,
            email,
            name,
            company,
            plan,
          }),
        })

        // Redirect to success page
        router.push(`/success?email=${encodeURIComponent(email)}&plan=${plan}`)
      } else {
        throw new Error("Payment not completed. Please try again.")
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      setError(error.message || "Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loading && !clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Preparing your payment...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            type="text"
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div>
          <label htmlFor="card" className="block text-sm font-medium text-gray-700">
            Card Details
          </label>
          <div className="mt-1 block w-full px-3 py-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#9e2146",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {priceDetails && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-900">Order Summary</h3>
          <div className="mt-2 flex justify-between text-sm text-gray-500">
            <p>{plan === "premium" ? "Premium Plan" : "Standard Plan"}</p>
            <p>${priceDetails.unit_amount / 100}/month</p>
          </div>
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <p>Early Adopter Discount</p>
            <p>Applied</p>
          </div>
          <div className="mt-3 flex justify-between font-medium">
            <p>Total</p>
            <p>${priceDetails.unit_amount / 100}/month</p>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500">
        <p>Your card will be charged immediately upon subscription. You can cancel anytime.</p>
        <p className="mt-1">By subscribing, you agree to our Terms of Service and Privacy Policy.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={!stripe || loading}>
        {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
        {loading ? "Processing..." : "Subscribe Now"}
      </Button>
    </form>
  )
}
