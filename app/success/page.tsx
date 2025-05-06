"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EarlyAdopterSurvey } from "@/components/early-adopter-survey"
import { motion } from "framer-motion"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paymentStatus = searchParams.get("payment_status")
  const subscriptionId = searchParams.get("subscription_id")
  const paymentId = searchParams.get("payment_id")
  const plan = searchParams.get("plan")
  const email = searchParams.get("email")

  const [showSurvey, setShowSurvey] = useState(false)
  const [customerEmail, setCustomerEmail] = useState("")
  const [surveyError, setSurveyError] = useState<string | null>(null)

  // Redirect if payment was not successful
  useEffect(() => {
    if (paymentStatus !== "succeeded" && !subscriptionId && !paymentId) {
      router.push("/payment")
    }
  }, [paymentStatus, subscriptionId, paymentId, router])

  useEffect(() => {
    // If email is in URL params, use it
    if (email) {
      setCustomerEmail(email)
      return
    }

    // Otherwise try to fetch subscription details to get email
    const fetchSubscriptionDetails = async () => {
      if (subscriptionId) {
        try {
          const response = await fetch(`/api/subscription-details?id=${subscriptionId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.customer && data.customer.email) {
              setCustomerEmail(data.customer.email)
            }
          }
        } catch (error) {
          console.error("Error fetching subscription details:", error)
        }
      }
    }

    fetchSubscriptionDetails()
  }, [subscriptionId, email])

  const handleSurveyError = (error: string) => {
    console.error("Survey error:", error)
    setSurveyError(error)
    // Even if there's an error, we'll keep showing the survey component
    // but we'll display an error message
  }

  if (showSurvey) {
    return (
      <>
        {surveyError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 mx-auto max-w-2xl mt-4">
            <p>There was an error loading the survey: {surveyError}</p>
            <p>Please try refreshing the page or contact support.</p>
          </div>
        )}
        <EarlyAdopterSurvey
          email={customerEmail}
          subscriptionId={subscriptionId || paymentId || ""}
          plan={plan || ""}
          onError={handleSurveyError}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Successful</h1>

          <p className="text-gray-600 mb-6 max-w-sm">
            Thank you for subscribing to Nectic. Your payment has been processed successfully.
            {(subscriptionId || paymentId) && (
              <span className="block mt-2 text-xs text-gray-500">
                {subscriptionId ? `Subscription ID: ${subscriptionId}` : `Payment ID: ${paymentId}`}
              </span>
            )}
          </p>

          <div className="bg-amber-50 border border-amber-100 rounded-lg p-5 mb-6 w-full">
            <h3 className="font-medium text-amber-800 mb-2">Complete Your Onboarding</h3>
            <p className="text-amber-700 text-sm mb-4">
              Help us tailor Nectic to your specific needs by completing a quick onboarding survey.
            </p>
            <Button
              onClick={() => setShowSurvey(true)}
              className="w-full bg-amber-500 hover:bg-amber-600 transition-colors"
            >
              Start Onboarding <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="text-xs text-gray-400">
            <p style={{ color: "#6b7280", fontSize: "16px" }}>
              Need help? Contact our support team at
              <a
                href="mailto:helloegglabs@gmail.com?subject=Support%20Request&body=Hi%20Egglabs%20Support%2C%0A%0AI%20need%20assistance%20with..."
                style={{ color: "#f59e0b", textDecoration: "underline", marginLeft: "4px" }}
              >
                helloegglabs@gmail.com
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
