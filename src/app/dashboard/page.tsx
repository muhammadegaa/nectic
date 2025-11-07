"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getRecommendedOpportunities, type Opportunity } from "@/lib/opportunities-service"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { MissionControl } from "@/components/dashboard/mission-control"
import { InsightMetrics } from "@/components/dashboard/insight-metrics"
import { FreeTrialBanner } from "@/components/free-trial-banner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const isGenerating = searchParams.get("generating") === "true"
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingOpportunities, setGeneratingOpportunities] = useState(isGenerating)
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
          setOpportunities(data as Opportunity[])
          
          // If we were generating and now have opportunities, stop loading state
          if (generatingOpportunities && data.length > 0) {
            setGeneratingOpportunities(false)
            // Remove ?generating=true from URL
            window.history.replaceState({}, "", "/dashboard")
          }
        } else {
          // No user - show empty state
          setOpportunities([])
        }
      } catch (err) {
        console.error("Failed to load recommended opportunities:", err)
        setError("Failed to load opportunities. Please try again.")
        setOpportunities([])
        setGeneratingOpportunities(false)
      } finally {
        setLoading(false)
      }
    }

    loadRecommendedOpportunities()

    // If generating, poll for opportunities every 3 seconds
    if (generatingOpportunities && user?.uid) {
      const pollInterval = setInterval(() => {
        loadRecommendedOpportunities()
      }, 3000)

      // Stop polling after 60 seconds
      const timeout = setTimeout(() => {
        clearInterval(pollInterval)
        setGeneratingOpportunities(false)
      }, 60000)

      return () => {
        clearInterval(pollInterval)
        clearTimeout(timeout)
      }
    }
  }, [user, generatingOpportunities])

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
    <div className="space-y-8 p-6">
      <FreeTrialBanner />
      
      {generatingOpportunities && (
        <Alert className="bg-amber-50 border-amber-200">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          <AlertDescription className="text-amber-800">
            Generating your personalized AI opportunities... This usually takes 30-60 seconds. 
            Your dashboard will update automatically.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-50/60 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Nectic Command Center</p>
            <h1 className="text-3xl font-semibold text-slate-900">Welcome back, {userName}</h1>
            <p className="text-sm text-slate-500">{userIndustry}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 capitalize">
                {subscriptionTier} plan
              </span>
              <span className="text-xs text-slate-500">Renews {subscriptionRenewal}</span>
            </div>
          </div>
        </div>
      </div>

      {opportunities.length > 0 && <InsightMetrics opportunities={opportunities as any} />}

      <MissionControl
        hasCompletedAssessment={Boolean(user?.hasCompletedAssessment)}
        hasOpportunities={opportunities.length > 0}
        hasActiveSubscription={subscriptionTier !== "free"}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Recommended Opportunities</h2>
          <Link href="/dashboard/opportunities" className="text-sm font-medium text-amber-600 hover:text-amber-700">
            View full portfolio →
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {opportunities.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="border border-slate-200/80 shadow-sm">
                <CardContent className="space-y-4 p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Impact score {Math.round(opportunity.impactScore || 0)}%
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {opportunity.title || opportunity.name}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-3">{opportunity.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-y-1">
                      <p className="text-slate-500">Monthly savings</p>
                      <p className="font-semibold text-slate-900">
                        ${Number(opportunity.monthlySavings || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-slate-500">Time saved</p>
                      <p className="font-semibold text-slate-900">
                        {Math.round(opportunity.timeSavedHours || 0)} hrs/mo
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/opportunities/${opportunity.id}`}
                    className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700"
                  >
                    View playbook
                    <span className="ml-1">→</span>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-900">Build your AI portfolio</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto">
              Complete the readiness diagnostic to generate a board-ready briefing with quantified automation impact.
            </p>
            <Link
              href="/dashboard/assessment"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600"
            >
              Start diagnostic
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardContent />
    </Suspense>
  )
}
