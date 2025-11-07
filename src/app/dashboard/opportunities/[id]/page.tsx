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
              <CardTitle>{opportunity.title || opportunity.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">{opportunity.description}</p>

              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Monthly Savings</p>
                    <p className="text-lg">${opportunity.monthlySavings.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Time Saved</p>
                    <p className="text-lg">{opportunity.timeSavedHours} hours/month</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-amber-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Impact Score</p>
                    <p className="text-lg">{opportunity.impactScore}%</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-purple-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Implementation Time</p>
                    <p className="text-lg">{opportunity.implementationTimeWeeks} weeks</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Benefits</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {opportunity.benefits.map((benefit, index) => (
                    <li key={index} className="text-gray-600">
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Requirements</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {opportunity.requirements.map((requirement, index) => (
                    <li key={index} className="text-gray-600">
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Implementation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Department</p>
                  <p className="text-gray-600 capitalize">{opportunity.department.replace(/-/g, " ")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Complexity</p>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-8 mr-1 rounded ${
                          i < opportunity.complexity ? "bg-blue-500" : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Implementation Effort</p>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-8 mr-1 rounded ${
                          i < opportunity.implementationEffort ? "bg-amber-500" : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Quick Win</p>
                  <p className="text-gray-600">{opportunity.quickWin ? "Yes" : "No"}</p>
                </div>
              </div>

              <div className="mt-6">
                <Button className="w-full">Start Implementation</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}