"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Filter, ArrowUpDown, FileText, Calendar, Users, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

// Mock implementation projects
const mockProjects = [
  {
    id: "proj1",
    title: "Customer Support Chatbot",
    description: "AI-powered chatbot for handling customer inquiries",
    status: "in-progress",
    progress: 65,
    startDate: "2025-03-01",
    estimatedCompletion: "2025-04-15",
    team: ["John Doe", "Sarah Smith"],
    nextMilestone: "Integration Testing",
    nextMilestoneDate: "2025-03-25",
    category: "customer",
  },
  {
    id: "proj2",
    title: "Sales Forecasting Model",
    description: "Predictive analytics for sales forecasting",
    status: "planning",
    progress: 20,
    startDate: "2025-03-10",
    estimatedCompletion: "2025-05-20",
    team: ["Emily Chen", "Robert Taylor", "Lisa Brown"],
    nextMilestone: "Data Collection",
    nextMilestoneDate: "2025-03-30",
    category: "analytics",
  },
  {
    id: "proj3",
    title: "Document Processing Automation",
    description: "AI-powered document processing and data extraction",
    status: "at-risk",
    progress: 40,
    startDate: "2025-02-15",
    estimatedCompletion: "2025-04-01",
    team: ["David Wilson", "Mike Johnson"],
    nextMilestone: "OCR Implementation",
    nextMilestoneDate: "2025-03-20",
    category: "automation",
  },
]

export default function ImplementationPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("progress")
  const [filterBy, setFilterBy] = useState("all")

  // Filter and sort projects
  const filteredProjects = mockProjects
    .filter(
      (project) =>
        (filterBy === "all" || project.category === filterBy || project.status === filterBy) &&
        (project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => {
      if (sortBy === "progress") {
        return b.progress - a.progress
      } else if (sortBy === "date") {
        return new Date(a.estimatedCompletion).getTime() - new Date(b.estimatedCompletion).getTime()
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title)
      }
      return 0
    })

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planning":
        return <Badge className="bg-blue-100 text-blue-800">Planning</Badge>
      case "in-progress":
        return <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>
      case "at-risk":
        return <Badge className="bg-red-100 text-red-800">At Risk</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Implementation Projects</h1>
          <p className="text-gray-500">Track and manage your AI implementation projects</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/opportunities">Start New Project</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>Filter</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
              <SelectItem value="automation">Automation</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="customer">Customer Experience</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span>Sort</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="date">Completion Date</SelectItem>
              <SelectItem value="title">Project Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="rounded-full bg-gray-100 p-3 mb-4">
              <FileText className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchQuery
                ? `No projects matching "${searchQuery}" were found.`
                : "You don't have any active implementation projects yet."}
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/opportunities">Start New Project</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{project.title}</CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                    <CardDescription>{project.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-500">Progress:</div>
                    <div className="font-medium">{project.progress}%</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={project.progress} className="h-2 mb-4" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Timeline</div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {formatDate(project.startDate)} - {formatDate(project.estimatedCompletion)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Team</div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{project.team.join(", ")}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Next Milestone</div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>
                        {project.nextMilestone} ({formatDate(project.nextMilestoneDate)})
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                {project.status === "at-risk" && (
                  <Button variant="outline" size="sm" className="text-red-600">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    View Issues
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/implementation/${project.id}`}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
