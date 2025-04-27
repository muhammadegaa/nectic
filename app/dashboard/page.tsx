"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getRecommendedOpportunities, type Opportunity } from "@/lib/opportunities-service"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

// Mock data for when auth fails
const mockOpportunities: Opportunity[] = [
  {
    id: "opp1",
    title: "AI Customer Service Automation",
    description: "Implement AI chatbots to handle routine customer inquiries",
    impactScore: 85,
    monthlySavings: 4250,
    timeSaved: "120 hours/month",
    industry: "retail",
    implementationTime: "2-4 weeks",
    costRange: "$5,000-$15,000",
    roi: "3-6 months",
    status: "new",
    department: "customer-service",
    complexity: 3,
    benefits: ["Reduce response time by 75%", "Handle 60% of inquiries without human intervention"],
    requirements: ["Access to customer service email/chat systems", "Historical customer inquiry data"],
    recommended: true,
    quickWin: false,
    createdAt: new Date(),
  },
  {
    id: "opp2",
    title: "Predictive Inventory Management",
    description: "Use AI to forecast inventory needs and reduce stockouts",
    impactScore: 78,
    monthlySavings: 3500,
    timeSaved: "90 hours/month",
    industry: "retail",
    implementationTime: "1-3 months",
    costRange: "$10,000-$25,000",
    roi: "4-8 months",
    status: "in-progress",
    department: "operations",
    complexity: 4,
    benefits: ["Reduce stockouts by 35%", "Optimize inventory levels"],
    requirements: ["Historical inventory data", "Sales data"],
    recommended: true,
    quickWin: false,
    createdAt: new Date(),
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRecommendedOpportunities() {
      try {
        setLoading(true)
        if (user) {
          // Use the getRecommendedOpportunities function which now returns dummy data
          const data = await getRecommendedOpportunities(user.uid)
          setOpportunities(data)
        } else {
          // Use mock data if user is not available
          setOpportunities(mockOpportunities)
        }
      } catch (err) {
        console.error("Failed to load recommended opportunities:", err)
        // Fallback to mock data on error
        setOpportunities(mockOpportunities)
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
  const subscriptionTier = user?.subscription?.tier || "free"
  const subscriptionRenewal = user?.subscription?.currentPeriodEnd
    ? user.subscription.currentPeriodEnd.toDate().toLocaleDateString()
    : "N/A"

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
      {opportunities.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id}>
              <CardContent className="p-6">
                <h3 className="font-medium mb-1">{opportunity.title}</h3>
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
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            No recommendations yet. Complete your profile to get personalized suggestions.
          </p>
        </div>
      )}
    </div>
  )
}
