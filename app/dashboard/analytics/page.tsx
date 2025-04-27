"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Mock data for charts
const opportunityStatusData = [
  { name: "Identified", value: 12 },
  { name: "Evaluating", value: 8 },
  { name: "Planning", value: 5 },
  { name: "Implementing", value: 7 },
  { name: "Completed", value: 4 },
]

const implementationTimelineData = [
  { month: "Jan", started: 2, completed: 1 },
  { month: "Feb", started: 3, completed: 2 },
  { month: "Mar", started: 5, completed: 3 },
  { month: "Apr", started: 4, completed: 4 },
  { month: "May", started: 6, completed: 3 },
  { month: "Jun", started: 4, completed: 5 },
]

const roiData = [
  { month: "Jan", value: 10000 },
  { month: "Feb", value: 25000 },
  { month: "Mar", value: 45000 },
  { month: "Apr", value: 70000 },
  { month: "May", value: 95000 },
  { month: "Jun", value: 120000 },
]

const roiCategoryData = [
  { name: "Efficiency", value: 45 },
  { name: "Cost Savings", value: 30 },
  { name: "Revenue", value: 15 },
  { name: "Customer Exp", value: 10 },
]

const teamUtilizationData = [
  { name: "John", value: 85 },
  { name: "Sarah", value: 75 },
  { name: "Emily", value: 90 },
  { name: "Robert", value: 60 },
  { name: "Lisa", value: 70 },
]

const projectsPerTeamMemberData = [
  { name: "John", active: 3, completed: 5 },
  { name: "Sarah", active: 2, completed: 3 },
  { name: "Emily", active: 4, completed: 2 },
  { name: "Robert", active: 1, completed: 4 },
  { name: "Lisa", active: 2, completed: 1 },
]

// Colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6m")

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-500">Track your AI implementation metrics and ROI</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">36</div>
                <p className="text-xs text-green-600 mt-1">↑ 12% from previous period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Implementation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">68%</div>
                <p className="text-xs text-green-600 mt-1">↑ 5% from previous period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$120,000</div>
                <p className="text-xs text-green-600 mt-1">↑ 18% from previous period</p>
              </CardContent>
            </Card>
          </div>

          {/* Opportunity Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Opportunity Status</CardTitle>
              <CardDescription>Current status of all identified opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={opportunityStatusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Opportunities" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Implementation Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Implementation Timeline</CardTitle>
              <CardDescription>Projects started vs. completed over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={implementationTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="started"
                      name="Projects Started"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line type="monotone" dataKey="completed" name="Projects Completed" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          {/* ROI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average ROI per Project</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$24,000</div>
                <p className="text-xs text-green-600 mt-1">↑ 8% from previous period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Highest ROI Project</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$45,000</div>
                <p className="text-xs text-gray-500 mt-1">Customer Support Chatbot</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">ROI to Cost Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">3.2x</div>
                <p className="text-xs text-green-600 mt-1">↑ 0.4x from previous period</p>
              </CardContent>
            </Card>
          </div>

          {/* Cumulative ROI Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cumulative ROI</CardTitle>
              <CardDescription>Total return on investment over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={roiData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "ROI"]} />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Cumulative ROI" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* ROI by Category Chart */}
          <Card>
            <CardHeader>
              <CardTitle>ROI by Category</CardTitle>
              <CardDescription>Return on investment across different categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roiCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roiCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          {/* Team Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Team Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">5</div>
                <p className="text-xs text-green-600 mt-1">↑ 1 from previous period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Projects per Member</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">2.4</div>
                <p className="text-xs text-amber-600 mt-1">↓ 0.2 from previous period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Team Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">76%</div>
                <p className="text-xs text-green-600 mt-1">↑ 4% from previous period</p>
              </CardContent>
            </Card>
          </div>

          {/* Team Utilization Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Team Utilization</CardTitle>
              <CardDescription>Resource allocation across projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamUtilizationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => [`${value}%`, "Utilization"]} />
                    <Legend />
                    <Bar dataKey="value" name="Utilization %" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Projects per Team Member Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Projects per Team Member</CardTitle>
              <CardDescription>Number of active and completed projects by team member</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectsPerTeamMemberData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active" name="Active Projects" fill="#8884d8" />
                    <Bar dataKey="completed" name="Completed Projects" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
