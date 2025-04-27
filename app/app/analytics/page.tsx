"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, Clock } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import OpportunityStatusChart from "@/components/opportunity-status-chart"

// Sample data for charts
const opportunitiesByCategoryData = [
  { name: "Customer Service", value: 12 },
  { name: "Sales", value: 8 },
  { name: "Marketing", value: 6 },
  { name: "Operations", value: 10 },
  { name: "HR", value: 4 },
]

const implementationStatusData = [
  { name: "Implemented", value: 11, color: "#3b82f6" },
  { name: "In Progress", value: 12, color: "#10b981" },
  { name: "Planned", value: 17, color: "#f59e0b" },
  { name: "Identified", value: 8, color: "#f97316" },
]

const monthlyImplementationsData = [
  { name: "Jan", completed: 2, started: 4 },
  { name: "Feb", completed: 3, started: 5 },
  { name: "Mar", completed: 4, started: 3 },
  { name: "Apr", completed: 3, started: 6 },
  { name: "May", completed: 5, started: 4 },
  { name: "Jun", completed: 4, started: 5 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"]

// Simple Bar Chart Component
function SimpleBarChart({ data, dataKey = "value", nameKey = "name", height = 300 }) {
  const maxValue = Math.max(...data.map((item) => item[dataKey]))

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      {data.map((item, index) => (
        <div key={index} className="flex items-center mb-4">
          <div className="w-24 text-sm truncate mr-2">{item[nameKey]}</div>
          <div className="flex-1">
            <div
              className="h-6 rounded"
              style={{
                width: `${(item[dataKey] / maxValue) * 100}%`,
                backgroundColor: item.color || COLORS[index % COLORS.length],
              }}
            ></div>
          </div>
          <div className="ml-2 text-sm font-medium">{item[dataKey]}</div>
        </div>
      ))}
    </div>
  )
}

// CSS Pie Chart Component
function CSSPieChart({ data, height = 300 }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Calculate percentages and angles for CSS conic gradient
  const dataWithPercentage = data.map((item, index) => {
    const percentage = (item.value / total) * 100
    const previousPercentages = data.slice(0, index).reduce((sum, prevItem) => sum + (prevItem.value / total) * 100, 0)

    return {
      ...item,
      percentage: percentage.toFixed(1),
      startAngle: previousPercentages * 3.6, // Convert percentage to degrees (100% = 360 degrees)
      endAngle: (previousPercentages + percentage) * 3.6,
    }
  })

  // Create the conic gradient string for CSS
  const createConicGradient = () => {
    let gradientString = "conic-gradient("
    dataWithPercentage.forEach((item, index) => {
      gradientString += `${item.color} ${item.startAngle}deg ${item.endAngle}deg${index < dataWithPercentage.length - 1 ? ", " : ""}`
    })
    gradientString += ")"
    return gradientString
  }

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="flex justify-center mb-8" style={{ height: "60%" }}>
        <div
          className="relative rounded-full"
          style={{
            width: "200px",
            height: "200px",
            background: createConicGradient(),
          }}
        >
          {/* Center white circle to create donut effect */}
          <div
            className="absolute rounded-full bg-white"
            style={{
              top: "25%",
              left: "25%",
              width: "50%",
              height: "50%",
              boxShadow: "inset 0 0 8px rgba(0,0,0,0.1)",
            }}
          ></div>
        </div>
      </div>

      <div className="mt-4">
        {dataWithPercentage.map((item, index) => (
          <div key={index} className="flex justify-between text-sm mb-1">
            <span className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
              {item.name}
            </span>
            <span className="font-medium">
              {item.percentage}% ({item.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Simple Grouped Bar Chart
function SimpleGroupedBarChart({ data, keys, nameKey = "name", height = 300 }) {
  const maxValue = Math.max(...data.flatMap((item) => keys.map((key) => item[key])))

  return (
    <div className="w-full" style={{ height: `${height}px`, overflow: "auto" }}>
      <div className="flex flex-wrap justify-center mb-4">
        {keys.map((key, index) => (
          <div key={index} className="flex items-center mr-4 mb-2">
            <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
            <span className="text-sm">{key}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="mb-4">
            <div className="text-sm font-medium mb-1">{item[nameKey]}</div>
            {keys.map((key, keyIndex) => (
              <div key={keyIndex} className="flex items-center mb-1">
                <div className="w-20 text-xs text-gray-500 mr-2">{key}</div>
                <div className="flex-1">
                  <div
                    className="h-4 rounded"
                    style={{
                      width: `${(item[key] / maxValue) * 100}%`,
                      backgroundColor: COLORS[keyIndex % COLORS.length],
                    }}
                  ></div>
                </div>
                <div className="ml-2 text-xs">{item[key]}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Sample data for demonstration
const sampleOpportunities = [
  { id: 1, status: "Implemented" },
  { id: 2, status: "In Progress" },
  { id: 3, status: "Planned" },
  { id: 4, status: "Identified" },
  { id: 5, status: "Implemented" },
  { id: 6, status: "In Progress" },
  { id: 7, status: "Planned" },
  { id: 8, status: "Identified" },
  { id: 9, status: "Implemented" },
  { id: 10, status: "In Progress" },
  { id: 11, status: "Planned" },
  { id: 12, status: "Identified" },
  // Add more sample data to match the counts shown in the screenshot
  { id: 13, status: "Implemented" },
  { id: 14, status: "In Progress" },
  { id: 15, status: "Planned" },
  { id: 16, status: "Planned" },
  { id: 17, status: "Planned" },
  { id: 18, status: "Planned" },
  { id: 19, status: "Planned" },
  { id: 20, status: "Planned" },
  { id: 21, status: "Implemented" },
  { id: 22, status: "Implemented" },
  { id: 23, status: "Implemented" },
  { id: 24, status: "Implemented" },
  { id: 25, status: "Implemented" },
  { id: 26, status: "Implemented" },
  { id: 27, status: "Implemented" },
  { id: 28, status: "Implemented" },
  { id: 29, status: "In Progress" },
  { id: 30, status: "In Progress" },
  { id: 31, status: "In Progress" },
  { id: 32, status: "In Progress" },
  { id: 33, status: "In Progress" },
  { id: 34, status: "In Progress" },
  { id: 35, status: "In Progress" },
  { id: 36, status: "In Progress" },
  { id: 37, status: "In Progress" },
  { id: 38, status: "In Progress" },
  { id: 39, status: "Planned" },
  { id: 40, status: "Planned" },
  { id: 41, status: "Planned" },
  { id: 42, status: "Planned" },
  { id: 43, status: "Planned" },
  { id: 44, status: "Planned" },
  { id: 45, status: "Planned" },
  { id: 46, status: "Planned" },
  { id: 47, status: "Identified" },
  { id: 48, status: "Identified" },
]

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("6m")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("opportunities")
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [mounted, setMounted] = useState(false)
  const [opportunityStatusData, setOpportunityStatusData] = useState<any[]>([])

  // Handle component mounting
  useEffect(() => {
    setMounted(true)

    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Count opportunities by status
    const statusCounts: Record<string, number> = {}
    sampleOpportunities.forEach((opportunity) => {
      statusCounts[opportunity.status] = (statusCounts[opportunity.status] || 0) + 1
    })

    // Calculate total
    const total = sampleOpportunities.length

    // Prepare data with percentages and colors
    const statusColors: Record<string, string> = {
      Implemented: "#3c82f6", // Blue
      "In Progress": "#34d399", // Green
      Planned: "#fbbf24", // Yellow
      Identified: "#fb923c", // Orange
    }

    const data = Object.keys(statusCounts).map((status) => ({
      status,
      count: statusCounts[status],
      percentage: (statusCounts[status] / total) * 100,
      color: statusColors[status] || "#888888",
    }))

    setOpportunityStatusData(data)
  }, [])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-500">Track your AI implementation metrics and ROI</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className={isMobile ? "w-full" : "w-[150px]"}>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>
                  {timeRange === "1m"
                    ? "Last Month"
                    : timeRange === "3m"
                      ? "Last 3 Months"
                      : timeRange === "6m"
                        ? "Last 6 Months"
                        : timeRange === "1y"
                          ? "Last Year"
                          : "Custom"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className={isMobile ? "w-full" : ""}>
            <Download className="h-4 w-4 mr-2" />
            <span className={isMobile ? "" : "hidden sm:inline"}>Download report</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Opportunities</CardDescription>
            <CardTitle className="text-2xl">48</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span>+12% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Implementation Rate</CardDescription>
            <CardTitle className="text-2xl">23%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span>+5% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total ROI</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(255000)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span>+18% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Implementation Time</CardDescription>
            <CardTitle className="text-2xl">42 days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-red-600">
              <TrendingDown className="mr-1 h-4 w-4" />
              <span>-3 days from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="opportunities" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start md:justify-center">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OpportunityStatusChart data={opportunityStatusData} />

            {/* Add other analytics components here */}
            <Card>
              <CardHeader>
                <CardTitle>Implementation Progress</CardTitle>
                <CardDescription>Overall progress of opportunity implementation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Implementation tracking chart will appear here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Projection</CardTitle>
                <CardDescription>Projected return on investment over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">ROI projection chart will appear here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Impact</CardTitle>
                <CardDescription>AI impact by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Department impact chart will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle>Opportunity Implementation Status by Category</CardTitle>
              <CardDescription>Detailed breakdown of implementation status across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleGroupedBarChart
                data={[
                  { name: "Automation", implemented: 5, inProgress: 3, planned: 4 },
                  { name: "Analytics", implemented: 2, inProgress: 4, planned: 2 },
                  { name: "Customer Experience", implemented: 3, inProgress: 2, planned: 5 },
                  { name: "Operations", implemented: 1, inProgress: 2, planned: 3 },
                  { name: "HR & Talent", implemented: 0, inProgress: 1, planned: 3 },
                ]}
                keys={["implemented", "inProgress", "planned"]}
                height={280}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="min-h-[400px]">
              <CardHeader>
                <CardTitle>Implementation Timeline</CardTitle>
                <CardDescription>Projects started vs. completed over time</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleGroupedBarChart
                  data={[
                    { name: "Jan", completed: 1, started: 2 },
                    { name: "Feb", completed: 2, started: 3 },
                    { name: "Mar", completed: 3, started: 4 },
                    { name: "Apr", completed: 2, started: 3 },
                    { name: "May", completed: 4, started: 2 },
                    { name: "Jun", completed: 3, started: 5 },
                  ]}
                  keys={["completed", "started"]}
                  height={280}
                />
              </CardContent>
            </Card>

            <Card className="min-h-[400px]">
              <CardHeader>
                <CardTitle>Implementation Metrics</CardTitle>
                <CardDescription>Key performance indicators for implementation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">Average Time to Implement</div>
                      <div className="text-sm text-gray-500">42 days</div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: "70%" }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <div>Target: 30 days</div>
                      <div>Best: 18 days</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">Implementation Success Rate</div>
                      <div className="text-sm text-gray-500">85%</div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <div>Target: 90%</div>
                      <div>Previous: 78%</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">Resource Utilization</div>
                      <div className="text-sm text-gray-500">72%</div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "72%" }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <div>Target: 80%</div>
                      <div>Previous: 65%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="min-h-[400px]">
              <CardHeader>
                <CardTitle>Cumulative ROI</CardTitle>
                <CardDescription>Total return on investment over time</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={[
                    { name: "Jan", value: 15000 },
                    { name: "Feb", value: 40000 },
                    { name: "Mar", value: 75000 },
                    { name: "Apr", value: 120000 },
                    { name: "May", value: 180000 },
                    { name: "Jun", value: 255000 },
                  ]}
                  height={280}
                />
              </CardContent>
            </Card>

            <Card className="min-h-[400px]">
              <CardHeader>
                <CardTitle>ROI by Category</CardTitle>
                <CardDescription>Return on investment across different categories</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={[
                    { name: "Automation", value: 120000 },
                    { name: "Analytics", value: 85000 },
                    { name: "Customer Experience", value: 65000 },
                    { name: "Operations", value: 45000 },
                    { name: "HR & Talent", value: 15000 },
                  ]}
                  height={280}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle>Top ROI Projects</CardTitle>
              <CardDescription>Projects with the highest return on investment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Customer Support Chatbot", roi: 85000, roiPercent: 340, category: "Customer Experience" },
                  { name: "Sales Forecasting Model", roi: 65000, roiPercent: 260, category: "Analytics" },
                  { name: "Invoice Processing Automation", roi: 55000, roiPercent: 220, category: "Automation" },
                  { name: "Inventory Optimization", roi: 45000, roiPercent: 180, category: "Operations" },
                  { name: "Employee Onboarding Automation", roi: 35000, roiPercent: 140, category: "HR & Talent" },
                ].map((project, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-gray-500">{project.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(project.roi)}</div>
                      <div className="text-sm text-green-600">+{project.roiPercent}% ROI</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="min-h-[450px]">
              <CardHeader>
                <CardTitle>Team Utilization</CardTitle>
                <CardDescription>Resource allocation across projects</CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto" style={{ maxHeight: "350px" }}>
                <div className="mb-4">
                  <div className="flex flex-wrap justify-center mb-4">
                    <div className="flex items-center mr-4 mb-2">
                      <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[0] }}></div>
                      <span className="text-sm">allocated</span>
                    </div>
                    <div className="flex items-center mr-4 mb-2">
                      <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[1] }}></div>
                      <span className="text-sm">available</span>
                    </div>
                  </div>
                </div>

                {[
                  { name: "John Doe", allocated: 85, available: 15 },
                  { name: "Sarah Smith", allocated: 70, available: 30 },
                  { name: "Emily Chen", allocated: 90, available: 10 },
                  { name: "Robert Taylor", allocated: 60, available: 40 },
                  { name: "Lisa Brown", allocated: 75, available: 25 },
                ].map((person, index) => (
                  <div key={index} className="mb-6">
                    <div className="text-sm font-medium mb-2">{person.name}</div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-20 text-xs text-gray-500 mr-2">allocated</div>
                        <div className="flex-1">
                          <div
                            className="h-4 rounded"
                            style={{
                              width: `${person.allocated}%`,
                              backgroundColor: COLORS[0],
                            }}
                          ></div>
                        </div>
                        <div className="ml-2 text-xs">{person.allocated}%</div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-20 text-xs text-gray-500 mr-2">available</div>
                        <div className="flex-1">
                          <div
                            className="h-4 rounded"
                            style={{
                              width: `${person.available}%`,
                              backgroundColor: COLORS[1],
                            }}
                          ></div>
                        </div>
                        <div className="ml-2 text-xs">{person.available}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="min-h-[450px]">
              <CardHeader>
                <CardTitle>Projects per Team Member</CardTitle>
                <CardDescription>Number of active projects by team member</CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto" style={{ maxHeight: "350px" }}>
                <SimpleBarChart
                  data={[
                    { name: "John Doe", value: 3 },
                    { name: "Sarah Smith", value: 2 },
                    { name: "Emily Chen", value: 4 },
                    { name: "Robert Taylor", value: 2 },
                    { name: "Lisa Brown", value: 3 },
                  ]}
                  height={280}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Key performance metrics by team member</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Team Member</th>
                    <th className="text-center py-3 px-2">Projects</th>
                    <th className="text-center py-3 px-2">Avg. Completion</th>
                    <th className="text-center py-3 px-2">On-Time Rate</th>
                    <th className="text-center py-3 px-2">Total ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "John Doe", projects: 3, avgCompletion: "28 days", onTimeRate: "92%", roi: 75000 },
                    { name: "Sarah Smith", projects: 2, avgCompletion: "32 days", onTimeRate: "85%", roi: 55000 },
                    { name: "Emily Chen", projects: 4, avgCompletion: "25 days", onTimeRate: "95%", roi: 95000 },
                    { name: "Robert Taylor", projects: 2, avgCompletion: "35 days", onTimeRate: "80%", roi: 45000 },
                    { name: "Lisa Brown", projects: 3, avgCompletion: "30 days", onTimeRate: "88%", roi: 65000 },
                  ].map((member, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-2">
                        <div className="font-medium">{member.name}</div>
                      </td>
                      <td className="text-center py-3 px-2">{member.projects}</td>
                      <td className="text-center py-3 px-2">
                        <div className="flex items-center justify-center">
                          <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                          <span>{member.avgCompletion}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">{member.onTimeRate}</td>
                      <td className="text-center py-3 px-2">{formatCurrency(member.roi)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsPage
