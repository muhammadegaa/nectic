"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Calendar, CheckCircle, Clock, DollarSign, Users } from "lucide-react"

// Sample completed implementations data
const completedImplementations = [
  {
    id: "imp-001",
    title: "Customer Support Chatbot",
    category: "Customer Experience",
    completionDate: "2023-05-15",
    team: ["John Doe", "Sarah Smith"],
    roi: 85000,
    timeToImplement: 45,
    description: "AI-powered chatbot that handles customer inquiries and support tickets automatically.",
    outcomes: [
      "Reduced response time by 75%",
      "Handling 65% of support tickets without human intervention",
      "Customer satisfaction increased by 12%",
    ],
  },
  {
    id: "imp-002",
    title: "Sales Forecasting Model",
    category: "Analytics",
    completionDate: "2023-06-22",
    team: ["Emily Chen", "Robert Taylor"],
    roi: 65000,
    timeToImplement: 60,
    description: "Machine learning model that predicts sales trends and forecasts revenue with high accuracy.",
    outcomes: [
      "Forecast accuracy improved by 28%",
      "Inventory management efficiency increased by 15%",
      "Reduced stockouts by 32%",
    ],
  },
  {
    id: "imp-003",
    title: "Invoice Processing Automation",
    category: "Automation",
    completionDate: "2023-07-10",
    team: ["Lisa Brown", "John Doe"],
    roi: 55000,
    timeToImplement: 30,
    description: "Automated system for processing invoices using OCR and machine learning.",
    outcomes: [
      "Processing time reduced from 15 minutes to 45 seconds per invoice",
      "Error rate decreased by 92%",
      "Finance team productivity increased by 35%",
    ],
  },
  {
    id: "imp-004",
    title: "Inventory Optimization",
    category: "Operations",
    completionDate: "2023-08-05",
    team: ["Robert Taylor", "Sarah Smith"],
    roi: 45000,
    timeToImplement: 50,
    description: "AI system that optimizes inventory levels based on demand forecasting and supply chain data.",
    outcomes: [
      "Inventory carrying costs reduced by 18%",
      "Order fulfillment rate improved by 9%",
      "Warehouse space utilization optimized by 22%",
    ],
  },
]

export default function CompletedImplementationsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-muted-foreground">Loading completed implementations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Completed Implementations</h1>
          <p className="text-gray-500">Review and analyze your successfully implemented AI projects</p>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="customer">Customer Experience</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {completedImplementations.map((implementation) => (
            <Card key={implementation.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{implementation.title}</CardTitle>
                    <CardDescription className="mt-1">{implementation.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {implementation.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">Completion Date</div>
                      <div className="text-sm text-gray-500">{formatDate(implementation.completionDate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">Implementation Time</div>
                      <div className="text-sm text-gray-500">{implementation.timeToImplement} days</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">ROI</div>
                      <div className="text-sm text-gray-500">{formatCurrency(implementation.roi)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">Team</div>
                      <div className="text-sm text-gray-500">{implementation.team.join(", ")}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Key Outcomes</h4>
                  <ul className="space-y-1">
                    {implementation.outcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          {completedImplementations
            .filter((imp) => imp.category === "Automation")
            .map((implementation) => (
              <Card key={implementation.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle>{implementation.title}</CardTitle>
                      <CardDescription className="mt-1">{implementation.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {implementation.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">Completion Date</div>
                        <div className="text-sm text-gray-500">{formatDate(implementation.completionDate)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">Implementation Time</div>
                        <div className="text-sm text-gray-500">{implementation.timeToImplement} days</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">ROI</div>
                        <div className="text-sm text-gray-500">{formatCurrency(implementation.roi)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">Team</div>
                        <div className="text-sm text-gray-500">{implementation.team.join(", ")}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Key Outcomes</h4>
                    <ul className="space-y-1">
                      {implementation.outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        {/* Similar content for other tabs */}
        <TabsContent value="analytics" className="space-y-6">
          {completedImplementations
            .filter((imp) => imp.category === "Analytics")
            .map((implementation) => (
              <Card key={implementation.id} className="overflow-hidden">
                {/* Same card content structure as above */}
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle>{implementation.title}</CardTitle>
                      <CardDescription className="mt-1">{implementation.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {implementation.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Same card content as above */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">Completion Date</div>
                        <div className="text-sm text-gray-500">{formatDate(implementation.completionDate)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">Implementation Time</div>
                        <div className="text-sm text-gray-500">{implementation.timeToImplement} days</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">ROI</div>
                        <div className="text-sm text-gray-500">{formatCurrency(implementation.roi)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">Team</div>
                        <div className="text-sm text-gray-500">{implementation.team.join(", ")}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Key Outcomes</h4>
                    <ul className="space-y-1">
                      {implementation.outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
