"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useCurrency } from "@/lib/currency-context"
import { formatCurrency } from "@/lib/currency-utils"

// Simple email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return email && emailRegex.test(email)
}

export default function CheckoutForm({
  clientSecret,
  customerId,
  plan,
  initialEmail = "",
  initialName = "",
  planPrice,
}: {
  clientSecret: string
  customerId: string
  plan: string | null
  initialEmail?: string
  initialName?: string
  planPrice?: number
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const { user } = useAuth()
  const { currency } = useCurrency()

  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [isSuccess, setIsSuccess] = useState(false)
  const [formTouched, setFormTouched] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [elementsReady, setElementsReady] = useState(false)
  const [paymentMethodSelected, setPaymentMethodSelected] = useState(false)

  // Use the correct prices based on the plan - EARLY ADOPTER PRICING
  const actualPlanPrice = plan === "premium" ? 399 : 199

  // Format the plan price based on the selected currency
  const formattedPrice = formatCurrency(actualPlanPrice, currency)

  // Check if Elements are ready
  useEffect(() => {
    if (elements) {
      setElementsReady(true)

      // Listen for changes in the PaymentElement
      const paymentElement = elements.getElement("payment")
      if (paymentElement) {
        paymentElement.on("change", (event) => {
          setPaymentMethodSelected(event.complete)
          if (event.error) {
            setErrorMessage(event.error.message)
          } else {
            setErrorMessage(undefined)
          }
        })
      }
    }
  }, [elements])

  // Save customer data when we have valid input
  useEffect(() => {
    const saveCustomerData = async () => {
      if (customerId && ((isValidEmail(email) && formTouched) || (isValidEmail(initialEmail) && !formTouched))) {
        try {
          const response = await fetch("/api/update-customer", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              customerId,
              email: email || initialEmail,
              name: name || initialName,
              plan,
              userId: user?.uid,
            }),
          })

          if (!response.ok) {
            console.error("Error updating customer data:", await response.json())
          }
        } catch (error) {
          console.error("Error updating customer data:", error)
        }
      }
    }

    if (customerId && (isValidEmail(initialEmail) || formTouched)) {
      saveCustomerData()
    }
  }, [customerId, email, name, plan, formTouched, initialEmail, initialName, user])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    setFormTouched(true)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setFormTouched(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setErrorMessage("Stripe has not loaded yet. Please refresh the page and try again.")
      return
    }

    if (!elementsReady) {
      setErrorMessage("Payment form is still loading. Please wait a moment and try again.")
      return
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.")
      return
    }

    if (!paymentMethodSelected) {
      setErrorMessage("Please complete your payment details before submitting.")
      return
    }

    if (paymentProcessing) {
      return // Prevent multiple submissions
    }

    setIsLoading(true)
    setPaymentProcessing(true)
    setErrorMessage(undefined)

    try {
      // 1. Submit the form to get payment details
      const { error: submitError } = await elements.submit()
      if (submitError) {
        throw new Error(submitError.message)
      }

      // 2. Create a payment method - this now works with paymentMethodCreation: 'manual'
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
        params: {
          billing_details: {
            name,
            email,
          },
        },
      })

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message)
      }

      // 3. Create the subscription with the payment method
      const subscriptionResponse = await fetch("/api/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.uid,
          plan,
          customerId,
          paymentMethodId: paymentMethod.id,
        }),
      })

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json()
        throw new Error(errorData.error || "Failed to create subscription")
      }

      const subscriptionData = await subscriptionResponse.json()

      // 4. Handle any required actions (like 3D Secure)
      if (subscriptionData.clientSecret) {
        const { error: confirmError } = await stripe.confirmPayment({
          clientSecret: subscriptionData.clientSecret,
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/success?subscription_id=${subscriptionData.subscriptionId}&plan=${plan}`,
          },
          redirect: "if_required",
        })

        if (confirmError) {
          throw new Error(confirmError.message)
        }
      }

      // 5. If no redirect happened, subscription was successful
      setIsSuccess(true)

      // 6. Redirect to success page after a short delay
      setTimeout(() => {
        router.push(`/success?subscription_id=${subscriptionData.subscriptionId}&plan=${plan}`)
      }, 2000)
    } catch (error) {
      console.error("Payment error:", error)
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
      setPaymentProcessing(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-6 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">Thank you for your subscription. Redirecting to your account...</p>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={handleNameChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            placeholder="your@email.com"
          />
        </div>
      </div>

      {/* Payment summary - UPDATED WITH EARLY ADOPTER PRICES */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-2">Payment Summary</h3>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">{plan === "premium" ? "Premium Plan" : "Standard Plan"}</span>
          <span className="font-medium">${plan === "premium" ? "399" : "199"}</span>
        </div>
        <div className="flex justify-between font-medium text-gray-900 pt-2 border-t border-gray-200">
          <span>Total today</span>
          <span>${plan === "premium" ? "399" : "199"}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Your card will be charged immediately.</p>
      </div>

      <div className="pt-2">
        <p className="text-sm font-medium text-gray-700 mb-2">Payment Information</p>
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <PaymentElement
            onChange={(e) => {
              setPaymentMethodSelected(e.complete)
              if (e.error) {
                setErrorMessage(e.error.message)
              } else {
                setErrorMessage(undefined)
              }
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {!elementsReady
            ? "Loading payment form..."
            : !paymentMethodSelected
              ? "Please complete your payment details"
              : "Payment details complete"}
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-50 p-4 rounded-md border border-red-100 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full group relative overflow-hidden h-12"
        disabled={!stripe || isLoading || paymentProcessing || !elementsReady || !paymentMethodSelected}
      >
        <span className="relative z-10">
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing Payment...
            </span>
          ) : (
            `Pay $${plan === "premium" ? "399" : "199"}`
          )}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </Button>

      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
        <ShieldCheck className="h-4 w-4 text-gray-400" />
        <p>Secure checkout powered by Stripe</p>
      </div>

      <p className="text-xs text-center text-gray-500">
        By proceeding, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  )
}
