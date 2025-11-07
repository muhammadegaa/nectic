"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getRecommendedOpportunities, type Opportunity } from "@/lib/opportunities-service"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (value: unknown): string | null => {
    if (!value) {
      return null
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toLocaleDateString()
    }

    if (typeof value === "number") {
      return new Date(value * 1000).toLocaleDateString()
    }

    if (typeof value === "string") {
      const numeric = Number(value)
      if (!Number.isNaN(numeric)) {
        return new Date(numeric * 1000).toLocaleDateString()
      }

      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString()
    }

    if (typeof value === "object") {
      const maybeTimestamp = value as { seconds?: number; _seconds?: number; toDate?: () => Date }
      if (typeof maybeTimestamp.seconds === "number") {
        return new Date(maybeTimestamp.seconds * 1000).toLocaleDateString()
      }
      if (typeof maybeTimestamp._seconds === "number") {
        return new Date(maybeTimestamp._seconds * 1000).toLocaleDateString()
      }
      if (typeof maybeTimestamp.toDate === "function") {
        const date = maybeTimestamp.toDate()
        return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : null
      }
    }

    return null
  }

  const getFormattedDate = (...values: unknown[]): string | null => {
    for (const value of values) {
      const formatted = formatDate(value)
      if (formatted) {
        return formatted
      }
    }
    return null
  }

  const subscription = (user as any)?.subscription

  useEffect(() => {
    async function loadRecommendedOpportunities() {
      try {
        setLoading(true)
        setError(null)
        if (user?.uid) {
          // Get opportunities from Firestore
          const data = await getRecommendedOpportunities(user.uid)
          setOpportunities(data as any)
        } else {
          // No user - show empty state
          setOpportunities([])
        }
      } catch (err) {
        console.error("Failed to load recommended opportunities:", err)
        setError("Failed to load opportunities. Please try again.")
        setOpportunities([])
      } finally {
        setLoading(false)
      }
    }

    loadRecommendedOpportunities()
  }, [user])

  if (loading) {
    return <LoadingSpinner />
  }

  // Display a simplified view if user is not available
  const userName = user?.displayName || "User"
  const userIndustry = user?.industry
    ? user.industry.replace(/-/g, " ")
    : "Complete your profile to get personalized recommendations"
  const subscriptionTier = subscription?.tier ?? "free"
  const subscriptionRenewal =
    getFormattedDate(subscription?.currentPeriodEnd, subscription?.current_period_end) ?? "N/A"

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userName}</h1>
        <p className="text-gray-500">{userIndustry}</p>
      </div>

      {/* Display subscription info */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="font-medium mb-2">Your Subscription</h2>
          <div className="flex items-center">
            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
              {subscriptionTier} Plan
            </div>
            <span className="text-sm text-gray-500 ml-4">Renews: {subscriptionRenewal}</span>
          </div>
        </CardContent>
      </Card>

      {/* Display recommended opportunities */}
      <h2 className="text-xl font-semibold mb-4">Recommended Opportunities</h2>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {opportunities.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id}>
              <CardContent className="p-6">
                <h3 className="font-medium mb-1">{opportunity.title || opportunity.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{opportunity.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-amber-600 font-medium">{opportunity.impactScore}% Impact</span>
                  <Link
                    href={`/dashboard/opportunities/${opportunity.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Details
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !loading ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            {user?.hasCompletedAssessment
              ? "No opportunities found. Complete an assessment to get personalized recommendations."
              : "Complete your AI readiness assessment to get personalized recommendations."}
          </p>
          {!user?.hasCompletedAssessment && (
            <Link
              href="/dashboard/assessment"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              Start Assessment →
            </Link>
          )}
        </div>
      ) : null}
    </div>
  )
}
