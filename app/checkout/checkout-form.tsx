"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ShieldCheck, AlertCircle, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useCurrency } from "@/lib/currency-context"
import { formatCurrency } from "@/lib/currency-utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Simple email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return email && emailRegex.test(email)
}

export default function CheckoutForm({
  clientSecret,
  customerId,
  plan,
  period = "6month",
  initialEmail = "",
  initialName = "",
}: {
  clientSecret: string
  customerId: string
  plan: string | null
  period?: string
  initialEmail?: string
  initialName?: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { currency } = useCurrency()

  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [company, setCompany] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [isSuccess, setIsSuccess] = useState(false)
  const [isPaymentFailed, setIsPaymentFailed] = useState(false)
  const [formTouched, setFormTouched] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [elementsReady, setElementsReady] = useState(false)
  const [paymentMethodSelected, setPaymentMethodSelected] = useState(false)

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

  // Format the prices based on the selected currency
  const formattedMonthlyPrice = formatCurrency(monthlyPrice, currency)
  const formattedTotalPrice = formatCurrency(totalPrice, currency)

  // Check URL parameters for payment status on component mount
  useEffect(() => {
    const paymentStatus = searchParams.get("payment_status")
    const paymentIntent = searchParams.get("payment_intent")
    const redirectStatus = searchParams.get("redirect_status")

    // Handle various payment statuses from URL parameters
    if (paymentStatus === "failed" || redirectStatus === "failed") {
      setIsPaymentFailed(true)
      setErrorMessage("Your payment was declined. Please try again with a different payment method.")
    } else if (paymentStatus === "canceled" || redirectStatus === "canceled") {
      setIsPaymentFailed(true)
      setErrorMessage("Your payment was canceled. You can try again when you're ready.")
    }

    // If we have a payment intent but no success status, check the payment status
    if (paymentIntent && !paymentStatus && stripe) {
      const checkPaymentStatus = async () => {
        try {
          const { paymentIntent: retrievedIntent } = await stripe.retrievePaymentIntent(clientSecret)
          if (retrievedIntent?.status === "succeeded") {
            setIsSuccess(true)
            setTimeout(() => {
              const successUrl = `/success?payment_status=succeeded&plan=${plan}&period=${period}&email=${encodeURIComponent(email || initialEmail)}`
              router.push(successUrl)
            }, 2000)
          } else if (retrievedIntent?.status === "requires_payment_method" || retrievedIntent?.status === "canceled") {
            setIsPaymentFailed(true)
            setErrorMessage("Your payment was not completed. Please try again.")
          }
        } catch (error) {
          console.error("Error checking payment status:", error)
        }
      }

      checkPaymentStatus()
    }
  }, [searchParams, stripe, clientSecret, router, plan, period, email, initialEmail])

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
              company,
              plan,
              period,
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
  }, [customerId, email, name, company, plan, period, formTouched, initialEmail, initialName, user])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    setFormTouched(true)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setFormTouched(true)
  }

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompany(e.target.value)
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
    setIsPaymentFailed(false)

    try {
      // 1. Submit the form to get payment details
      const { error: submitError } = await elements.submit()
      if (submitError) {
        throw new Error(submitError.message)
      }

      // 2. Create a payment method
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

      console.log("Payment method created:", paymentMethod.id)

      // Generate the return URL - include a success parameter
      const successUrl = `${window.location.origin}/success?payment_status=succeeded&plan=${plan}&period=${period}&email=${encodeURIComponent(email)}`

      // Generate the cancel URL - return to payment page with status
      const cancelUrl = `${window.location.origin}/payment?payment_status=canceled&plan=${plan}&period=${period}`

      // 3. Create a one-time payment
      const paymentResponse = await fetch("/api/create-one-time-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.uid,
          plan,
          period,
          customerId,
          paymentMethodId: paymentMethod.id,
          email,
          name,
          company,
          successUrl,
          cancelUrl,
        }),
      })

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json()
        throw new Error(errorData.error || "Failed to process payment")
      }

      const paymentData = await paymentResponse.json()
      console.log("Payment created:", paymentData)

      // 4. Check if we need to handle any next actions
      if (paymentData.status === "requires_action" && paymentData.nextAction) {
        // Handle the redirect flow
        if (paymentData.nextAction.type === "redirect_to_url") {
          window.location.href = paymentData.nextAction.redirect_to_url.url
          return
        }
      } else if (paymentData.status === "succeeded") {
        // 5. If payment succeeded immediately, show success state
        setIsSuccess(true)

        // 6. Save the customer details
        await fetch("/api/save-customer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId,
            paymentIntentId: paymentData.paymentIntentId,
            email,
            name,
            company,
            plan,
            period,
          }),
        })

        // 7. Redirect to success page after a short delay
        setTimeout(() => {
          router.push(successUrl)
        }, 2000)
      } else {
        // Handle other payment statuses
        throw new Error(`Payment status: ${paymentData.status}. Please try again.`)
      }
    } catch (error) {
      console.error("Payment error:", error)
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred.")
      setIsPaymentFailed(true)
    } finally {
      setIsLoading(false)
      setPaymentProcessing(false)
    }
  }

  const handleRetry = () => {
    setIsPaymentFailed(false)
    setErrorMessage(undefined)
  }

  if (isSuccess) {
    return (
      <div className="text-center py-6 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">Thank you for your purchase. Redirecting to your account...</p>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (isPaymentFailed) {
    return (
      <div className="text-center py-6 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Payment Failed</h1>
        <p className="text-gray-600 mb-6">{errorMessage || "There was an issue processing your payment."}</p>
        <Button onClick={handleRetry} className="bg-amber-500 hover:bg-amber-600">
          Try Again
        </Button>
      </div>
    )
  }

  // Get the billing period label
  const getPeriodLabel = () => {
    return period === "6month" ? "6 months" : "12 months"
  }

  // Get the number of months
  const getMonths = () => {
    return period === "6month" ? 6 : 12
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
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
            Email Address
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
        <div className="space-y-2">
          <label htmlFor="company" className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={handleCompanyChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            placeholder="Your Company"
          />
        </div>
      </div>

      {/* Payment summary */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-2">Payment Summary</h3>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">{plan === "premium" ? "Premium Plan" : "Standard Plan"}</span>
          <span className="font-medium">${monthlyPrice}/month</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Billing period</span>
          <span className="font-medium">{getPeriodLabel()}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Calculation</span>
          <span className="font-medium">
            ${monthlyPrice} × {getMonths()} months
          </span>
        </div>
        <div className="flex justify-between font-medium text-gray-900 pt-2 border-t border-gray-200">
          <span>Total payment</span>
          <span>${totalPrice}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          <strong>This is a one-time payment</strong> for the full {getPeriodLabel()} period at ${monthlyPrice}/month ($
          {monthlyPrice} × {getMonths()} = ${totalPrice}). We offer a 30-day money-back guarantee if you're not
          satisfied with our service.
        </p>
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

      {errorMessage && !isPaymentFailed && (
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
              <LoadingSpinner size="sm" className="mr-2" />
              Processing Payment...
            </span>
          ) : (
            `Pay $${totalPrice} for ${getMonths()} months`
          )}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </Button>

      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
        <ShieldCheck className="h-4 w-4 text-gray-400" />
        <p>Secure checkout by Nectic</p>
      </div>

      <p className="text-xs text-center text-gray-500">
        By proceeding, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  )
}
