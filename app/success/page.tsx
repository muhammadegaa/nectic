"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Droplet, CheckCircle2, Calendar, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useCurrency } from "@/lib/currency-context"
import { formatCurrency } from "@/lib/currency-utils"
import { EarlyAdopterSurvey } from "@/components/early-adopter-survey"
import { motion } from "framer-motion"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const subscriptionId = searchParams.get("subscription_id")
  const plan = searchParams.get("plan") || "standard"
  const { user } = useAuth()
  const { currency } = useCurrency()

  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    plan: string
    status: string
    amount: number
    currentPeriodEnd?: string
    currentPeriodStart?: string
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [testMode, setTestMode] = useState(false)
  const [testInput, setTestInput] = useState("")
  const [surveyCompleted, setSurveyCompleted] = useState(false)

  // For test mode
  useEffect(() => {
    // Check if we're in test mode (no subscription_id)
    if (!subscriptionId && plan) {
      setTestMode(true)
      setLoading(false)
    }
  }, [subscriptionId, plan])

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (testInput.toLowerCase() === "standard" || testInput.toLowerCase() === "premium") {
      router.push(`/success?plan=${testInput.toLowerCase()}`)
    }
  }

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (subscriptionId) {
        try {
          const response = await fetch(`/api/subscription-details?id=${subscriptionId}`)
          if (response.ok) {
            const data = await response.json()
            setSubscriptionDetails(data)
            setEmail(user?.email || "")
          }
        } catch (error) {
          console.error("Error fetching subscription details:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    if (subscriptionId) {
      fetchSubscriptionDetails()
    }
  }, [subscriptionId, user])

  // Format the subscription amount
  const formattedAmount = subscriptionDetails?.amount
    ? formatCurrency(subscriptionDetails.amount, currency)
    : plan === "premium"
      ? formatCurrency(399, currency)
      : formatCurrency(199, currency)

  const planName = plan === "premium" ? "Premium Plan" : "Standard Plan"

  // If in test mode and no plan is selected yet
  if (testMode && !plan) {
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

        <div className="container max-w-md mx-auto py-12 px-4 flex-1 flex items-center justify-center">
          <div className="w-full bg-white rounded-xl shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Test Mode</h1>
            <p className="text-gray-600 mb-6">Enter "standard" or "premium" to test the success page for that plan.</p>

            <form onSubmit={handleTestSubmit} className="space-y-4">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="standard or premium"
              />
              <Button type="submit" className="w-full">
                Test Success Page
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const handleSurveyComplete = () => {
    setSurveyCompleted(true)
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

      <div className="container max-w-3xl mx-auto py-8 px-4 flex-1">
        {loading ? (
          <div className="w-full bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading subscription details...</p>
            </div>
          </div>
        ) : surveyCompleted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full bg-white rounded-xl shadow-sm p-8 text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white mb-6">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h1 className="text-2xl font-bold mb-4">You're All Set!</h1>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Thank you for becoming an early adopter of Nectic and completing your onboarding.
            </p>

            <div className="bg-amber-50 p-6 rounded-lg border border-amber-100 mb-8 text-left">
              <div className="flex items-center mb-4">
                <Sparkles className="h-5 w-5 text-amber-500 mr-2" />
                <h3 className="font-semibold text-lg">Subscription Details</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-amber-100">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium">{planName}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-amber-100">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium">
                    {subscriptionDetails?.status === "active" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Processing
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-amber-100">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-medium">{formattedAmount} / month</span>
                </div>

                {subscriptionDetails?.currentPeriodStart && (
                  <div className="flex justify-between items-center pb-2 border-b border-amber-100">
                    <span className="text-gray-600">Billing period start</span>
                    <span className="font-medium">
                      {new Date(subscriptionDetails.currentPeriodStart).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {subscriptionDetails?.currentPeriodEnd && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Next billing date</span>
                    <span className="font-medium">
                      {new Date(subscriptionDetails.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Button
                asChild
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-2 h-auto"
              >
                <Link href={user ? "/dashboard" : "/"} className="flex items-center">
                  {user ? "Go to Dashboard" : "Return to Homepage"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <div className="flex items-center justify-center text-sm text-gray-500 mt-4">
                <Calendar className="h-4 w-4 mr-2" />
                <p>We'll be in touch soon with updates on our progress.</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Brief success message */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md p-8 text-center text-white"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome to Nectic!</h1>
              <p className="text-amber-50 max-w-md mx-auto">
                Your {planName} subscription is now active. Let's set up your account to get the most out of Nectic.
              </p>
            </motion.div>

            {/* Onboarding survey */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full bg-white rounded-xl shadow-md p-6 md:p-8"
            >
              <div className="mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold">Complete Your Onboarding</h2>
                <p className="text-gray-500">Help us tailor Nectic to your specific needs</p>
              </div>

              <EarlyAdopterSurvey
                email={email || user?.email || ""}
                subscriptionId={subscriptionId || undefined}
                plan={plan}
                onComplete={handleSurveyComplete}
              />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
