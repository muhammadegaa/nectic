"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MessageSquare,
  PlusCircle,
  Edit,
  Trash,
  PauseCircle,
  PlayCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Mock implementation projects (same as in the implementation page)
const mockProjects = [
  {
    id: "proj1",
    title: "Customer Service Automation",
    description: "Implementing AI chatbots to handle common customer inquiries",
    status: "in-progress",
    progress: 65,
    startDate: "2025-03-15",
    estimatedCompletion: "2025-05-01",
    team: ["John Doe", "Sarah Smith", "Mike Johnson"],
    tasks: [
      {
        id: "task1",
        title: "Requirements gathering",
        status: "completed",
        dueDate: "2025-03-22",
        assignee: "John Doe",
      },
      { id: "task2", title: "Vendor selection", status: "completed", dueDate: "2025-03-29", assignee: "Sarah Smith" },
      { id: "task3", title: "Initial setup", status: "completed", dueDate: "2025-04-05", assignee: "Mike Johnson" },
      {
        id: "task4",
        title: "Integration with existing systems",
        status: "in-progress",
        dueDate: "2025-04-15",
        assignee: "John Doe",
      },
      {
        id: "task5",
        title: "Testing and validation",
        status: "not-started",
        dueDate: "2025-04-22",
        assignee: "Sarah Smith",
      },
      { id: "task6", title: "Staff training", status: "not-started", dueDate: "2025-04-29", assignee: "Mike Johnson" },
    ],
    risks: [
      {
        id: "risk1",
        title: "Integration complexity",
        severity: "medium",
        mitigation: "Additional technical resources",
      },
      { id: "risk2", title: "User adoption", severity: "low", mitigation: "Comprehensive training program" },
    ],
    updates: [
      {
        id: "update1",
        date: "2025-04-01",
        author: "John Doe",
        content:
          "Integration with the CRM system is taking longer than expected due to API limitations. Working with the vendor to find a solution.",
      },
      {
        id: "update2",
        date: "2025-03-25",
        author: "Sarah Smith",
        content: "Vendor selection completed. We've chosen ChatBot Pro as our solution provider.",
      },
      {
        id: "update3",
        date: "2025-03-18",
        author: "Mike Johnson",
        content: "Requirements gathering phase completed. Moving on to vendor selection.",
      },
    ],
    documents: [
      { id: "doc1", name: "Requirements Document", type: "pdf", uploadedBy: "John Doe", uploadDate: "2025-03-18" },
      { id: "doc2", name: "Vendor Comparison", type: "xlsx", uploadedBy: "Sarah Smith", uploadDate: "2025-03-25" },
      { id: "doc3", name: "Implementation Plan", type: "docx", uploadedBy: "Mike Johnson", uploadDate: "2025-03-30" },
    ],
  },
  {
    id: "proj2",
    title: "Document Processing Automation",
    description: "Implementing AI for automated data extraction from financial documents",
    status: "planning",
    progress: 25,
    startDate: "2025-04-01",
    estimatedCompletion: "2025-05-15",
    team: ["Emily Chen", "David Wilson"],
    tasks: [
      {
        id: "task1",
        title: "Requirements gathering",
        status: "completed",
        dueDate: "2025-04-08",
        assignee: "Emily Chen",
      },
      {
        id: "task2",
        title: "Vendor evaluation",
        status: "in-progress",
        dueDate: "2025-04-15",
        assignee: "David Wilson",
      },
      {
        id: "task3",
        title: "Solution selection",
        status: "not-started",
        dueDate: "2025-04-22",
        assignee: "Emily Chen",
      },
      {
        id: "task4",
        title: "Implementation planning",
        status: "not-started",
        dueDate: "2025-04-29",
        assignee: "David Wilson",
      },
    ],
    risks: [
      { id: "risk1", title: "Document variety", severity: "high", mitigation: "Comprehensive document analysis" },
      { id: "risk2", title: "Data accuracy", severity: "medium", mitigation: "Validation workflows" },
    ],
    updates: [
      {
        id: "update1",
        date: "2025-04-05",
        author: "Emily Chen",
        content:
          "Requirements gathering phase completed. We've identified 12 different document types that need to be processed.",
      },
      {
        id: "update2",
        date: "2025-04-02",
        author: "David Wilson",
        content: "Project kickoff meeting held. Team roles and responsibilities assigned.",
      },
    ],
    documents: [
      { id: "doc1", name: "Document Types Analysis", type: "pdf", uploadedBy: "Emily Chen", uploadDate: "2025-04-05" },
      { id: "doc2", name: "Project Charter", type: "docx", uploadedBy: "David Wilson", uploadDate: "2025-04-02" },
    ],
  },
  {
    id: "proj3",
    title: "Sales Forecasting AI",
    description: "Implementing predictive analytics for sales forecasting",
    status: "on-hold",
    progress: 40,
    startDate: "2025-02-15",
    estimatedCompletion: "2025-04-30",
    team: ["Robert Taylor", "Lisa Brown"],
    tasks: [
      { id: "task1", title: "Data collection", status: "completed", dueDate: "2025-02-28", assignee: "Robert Taylor" },
      { id: "task2", title: "Model development", status: "in-progress", dueDate: "2025-03-15", assignee: "Lisa Brown" },
      {
        id: "task3",
        title: "Integration planning",
        status: "not-started",
        dueDate: "2025-03-30",
        assignee: "Robert Taylor",
      },
      { id: "task4", title: "User testing", status: "not-started", dueDate: "2025-04-15", assignee: "Lisa Brown" },
    ],
    risks: [
      { id: "risk1", title: "Data quality", severity: "high", mitigation: "Data cleansing procedures" },
      { id: "risk2", title: "Model accuracy", severity: "medium", mitigation: "Regular model retraining" },
    ],
    updates: [
      {
        id: "update1",
        date: "2025-03-10",
        author: "Lisa Brown",
        content: "Project put on hold due to resource constraints. Expected to resume in 2 weeks.",
      },
      {
        id: "update2",
        date: "2025-03-01",
        author: "Robert Taylor",
        content: "Data collection phase completed. Moving on to model development.",
      },
    ],
    documents: [
      {
        id: "doc1",
        name: "Data Collection Report",
        type: "pdf",
        uploadedBy: "Robert Taylor",
        uploadDate: "2025-03-01",
      },
      { id: "doc2", name: "Model Specifications", type: "docx", uploadedBy: "Lisa Brown", uploadDate: "2025-03-05" },
    ],
  },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  const projectId = params.id as string
  const project = mockProjects.find((p) => p.id === projectId)

  if (!project) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
        <p className="text-gray-500 mb-6">The project you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push("/dashboard/implementation")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    )
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planning":
        return <Badge className="bg-blue-100 text-blue-800">Planning</Badge>
      case "in-progress":
        return <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>
      case "on-hold":
        return <Badge className="bg-gray-100 text-gray-800">On Hold</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Get task status icon
  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "not-started":
        return <Clock className="h-4 w-4 text-gray-400" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get document icon
  const getDocumentIcon = (type: string) => {
    return <FileText className="h-4 w-4 text-blue-500" />
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/implementation")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{project.title}</h1>
              {getStatusBadge(project.status)}
            </div>
            <p className="text-gray-500">{project.description}</p>
          </div>

          <div className="flex items-center gap-2">
            {project.status === "in-progress" ? (
              <Button variant="outline">
                <PauseCircle className="mr-2 h-4 w-4" />
                Pause Project
              </Button>
            ) : project.status === "on-hold" ? (
              <Button variant="outline">
                <PlayCircle className="mr-2 h-4 w-4" />
                Resume Project
              </Button>
            ) : null}

            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Start Date</div>
                      <div className="font-medium">{formatDate(project.startDate)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Estimated Completion</div>
                      <div className="font-medium">{formatDate(project.estimatedCompletion)}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Progress</div>
                    <div className="space-y-1">
                      <Progress value={project.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0%</span>
                        <span>{project.progress}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Team Members</div>
                    <div className="flex flex-wrap gap-2">
                      {project.team.map((member, index) => (
                        <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-sm">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">{getInitials(member)}</AvatarFallback>
                          </Avatar>
                          <span>{member}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Task Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-green-50 p-3 rounded-md">
                      <div className="text-2xl font-bold text-green-700">
                        {project.tasks.filter((t) => t.status === "completed").length}
                      </div>
                      <div className="text-sm text-green-600">Completed</div>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-md">
                      <div className="text-2xl font-bold text-amber-700">
                        {project.tasks.filter((t) => t.status === "in-progress").length}
                      </div>
                      <div className="text-sm text-amber-600">In Progress</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-2xl font-bold text-gray-700">
                        {project.tasks.filter((t) => t.status === "not-started").length}
                      </div>
                      <div className="text-sm text-gray-600">Not Started</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Recent Tasks</div>
                    <div className="space-y-2">
                      {project.tasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center gap-2">
                            {getTaskStatusIcon(task.status)}
                            <span className="text-sm">{task.title}</span>
                          </div>
                          <div className="text-xs text-gray-500">Due: {formatDate(task.dueDate)}</div>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="w-full text-sm" asChild>
                        <a href="#tasks" onClick={() => setActiveTab("tasks")}>
                          View All Tasks
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Updates */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.updates.slice(0, 2).map((update) => (
                    <div key={update.id} className="border-l-2 border-amber-500 pl-4 py-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{getInitials(update.author)}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm font-medium">{update.author}</div>
                        <div className="text-xs text-gray-500">{formatDate(update.date)}</div>
                      </div>
                      <p className="text-sm">{update.content}</p>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full text-sm" asChild>
                    <a href="#updates" onClick={() => setActiveTab("updates")}>
                      View All Updates
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Risks Summary */}
            {project.risks.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Risk Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.risks.map((risk) => (
                      <div
                        key={risk.id}
                        className={`p-3 rounded-md ${
                          risk.severity === "high"
                            ? "bg-red-50"
                            : risk.severity === "medium"
                              ? "bg-amber-50"
                              : "bg-blue-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle
                            className={`h-4 w-4 ${
                              risk.severity === "high"
                                ? "text-red-500"
                                : risk.severity === "medium"
                                  ? "text-amber-500"
                                  : "text-blue-500"
                            }`}
                          />
                          <h4 className="text-sm font-medium">{risk.title}</h4>
                          <Badge
                            className={`ml-auto ${
                              risk.severity === "high"
                                ? "bg-red-100 text-red-800"
                                : risk.severity === "medium"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="text-sm ml-6">Mitigation: {risk.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Tasks</CardTitle>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="text-2xl font-bold text-green-700">
                      {project.tasks.filter((t) => t.status === "completed").length}
                    </div>
                    <div className="text-sm text-green-600">Completed</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-md">
                    <div className="text-2xl font-bold text-amber-700">
                      {project.tasks.filter((t) => t.status === "in-progress").length}
                    </div>
                    <div className="text-sm text-amber-600">In Progress</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-2xl font-bold text-gray-700">
                      {project.tasks.filter((t) => t.status === "not-started").length}
                    </div>
                    <div className="text-sm text-gray-600">Not Started</div>
                  </div>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Task
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Assignee
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Due Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {project.tasks.map((task) => (
                        <tr key={task.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {task.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getTaskStatusIcon(task.status)}
                              <span className="ml-2 text-sm text-gray-500 capitalize">
                                {task.status.replace("-", " ")}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">{getInitials(task.assignee)}</AvatarFallback>
                              </Avatar>
                              <span className="ml-2 text-sm text-gray-500">{task.assignee}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(task.dueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Team Members</CardTitle>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.team.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(member)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member}</div>
                        <div className="text-sm text-gray-500">{index === 0 ? "Project Lead" : "Team Member"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Project Updates</CardTitle>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Update
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {project.updates.map((update) => (
                  <div key={update.id} className="border-l-2 border-amber-500 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar>
                        <AvatarFallback>{getInitials(update.author)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{update.author}</div>
                        <div className="text-sm text-gray-500">{formatDate(update.date)}</div>
                      </div>
                    </div>
                    <p className="text-gray-700">{update.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Project Documents</CardTitle>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {project.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-3">
                      {getDocumentIcon(doc.type)}
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-xs text-gray-500">
                          Uploaded by {doc.uploadedBy} on {formatDate(doc.uploadDate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Project Risks</CardTitle>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Risk
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.risks.map((risk) => (
                  <div
                    key={risk.id}
                    className={`p-4 rounded-md ${
                      risk.severity === "high" ? "bg-red-50" : risk.severity === "medium" ? "bg-amber-50" : "bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle
                        className={`h-5 w-5 ${
                          risk.severity === "high"
                            ? "text-red-500"
                            : risk.severity === "medium"
                              ? "text-amber-500"
                              : "text-blue-500"
                        }`}
                      />
                      <h4 className="font-medium">{risk.title}</h4>
                      <Badge
                        className={`ml-auto ${
                          risk.severity === "high"
                            ? "bg-red-100 text-red-800"
                            : risk.severity === "medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {risk.severity}
                      </Badge>
                    </div>
                    <div className="ml-7">
                      <div className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Mitigation Strategy:</span> {risk.mitigation}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
