"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getOpportunityById, type Opportunity } from "@/lib/opportunities-service"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, Clock, DollarSign, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function OpportunityDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOpportunity() {
      try {
        setLoading(true)
        if (id) {
          const data = await getOpportunityById(id as string, user?.uid || "anonymous")
          setOpportunity(data)
        }
      } catch (err) {
        console.error("Failed to load opportunity:", err)
      } finally {
        setLoading(false)
      }
    }

    loadOpportunity()
  }, [id, user])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!opportunity) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link href="/dashboard" className="flex items-center text-blue-600 hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Link>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Opportunity not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/dashboard" className="flex items-center text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{opportunity.title || opportunity.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-lg mb-8">{opportunity.description}</p>

              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Key Benefits</h3>
                <ul className="space-y-3">
                  {opportunity.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-base">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>ROI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800 mb-1">Monthly Savings</p>
                  <p className="text-2xl font-bold text-green-900">${opportunity.monthlySavings.toLocaleString()}</p>
                  <p className="text-xs text-green-700 mt-1">${(opportunity.monthlySavings * 12).toLocaleString()} annually</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-1">Time Saved</p>
                  <p className="text-2xl font-bold text-blue-900">{opportunity.timeSavedHours} hrs/month</p>
                  <p className="text-xs text-blue-700 mt-1">~{Math.round(opportunity.timeSavedHours / 40)} FTE equivalent</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Impact Score</p>
                    <p className="text-lg font-bold text-amber-600">{opportunity.impactScore}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${opportunity.impactScore}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Implementation Time</p>
                  <p className="text-lg font-semibold">{opportunity.implementationTimeWeeks} weeks</p>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Link href="/checkout?plan=premium">
                  <Button className="w-full" size="lg">
                    Upgrade to See Vendors & Implementation Guide
                  </Button>
                </Link>
                <p className="text-xs text-center text-gray-500">
                  Premium features unlock vendor recommendations and step-by-step implementation plans
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}