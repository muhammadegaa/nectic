"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus, Mail, Phone, MoreHorizontal, UserPlus, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

// Mock team members data
const mockTeamMembers = [
  {
    id: "user1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    role: "AI Implementation Lead",
    department: "Technology",
    avatar: "/placeholder.svg?height=40&width=40",
    activeProjects: 3,
    completedProjects: 5,
    status: "active",
  },
  {
    id: "user2",
    name: "Sarah Smith",
    email: "sarah.smith@example.com",
    phone: "+1 (555) 234-5678",
    role: "Data Scientist",
    department: "Analytics",
    avatar: "/placeholder.svg?height=40&width=40",
    activeProjects: 2,
    completedProjects: 3,
    status: "active",
  },
  {
    id: "user3",
    name: "Emily Chen",
    email: "emily.chen@example.com",
    phone: "+1 (555) 345-6789",
    role: "Project Manager",
    department: "Operations",
    avatar: "/placeholder.svg?height=40&width=40",
    activeProjects: 4,
    completedProjects: 2,
    status: "active",
  },
  {
    id: "user4",
    name: "Robert Taylor",
    email: "robert.taylor@example.com",
    phone: "+1 (555) 456-7890",
    role: "Business Analyst",
    department: "Business",
    avatar: "/placeholder.svg?height=40&width=40",
    activeProjects: 1,
    completedProjects: 4,
    status: "inactive",
  },
  {
    id: "user5",
    name: "Lisa Brown",
    email: "lisa.brown@example.com",
    phone: "+1 (555) 567-8901",
    role: "UX Designer",
    department: "Design",
    avatar: "/placeholder.svg?height=40&width=40",
    activeProjects: 2,
    completedProjects: 1,
    status: "active",
  },
]

// Mock pending invitations
const mockInvitations = [
  {
    id: "inv1",
    email: "michael.johnson@example.com",
    role: "Machine Learning Engineer",
    department: "Technology",
    sentDate: "2025-03-15",
    status: "pending",
  },
  {
    id: "inv2",
    email: "jennifer.williams@example.com",
    role: "Business Analyst",
    department: "Business",
    sentDate: "2025-03-14",
    status: "pending",
  },
]

// Mock team projects
const mockTeamProjects = [
  {
    id: "proj1",
    title: "Customer Support Chatbot",
    description: "AI-powered chatbot for handling customer inquiries",
    status: "in-progress",
    progress: 65,
    team: ["John Doe", "Sarah Smith"],
    dueDate: "2025-04-15",
  },
  {
    id: "proj2",
    title: "Sales Forecasting Model",
    description: "Predictive analytics for sales forecasting",
    status: "planning",
    progress: 20,
    team: ["Emily Chen", "Robert Taylor", "Lisa Brown"],
    dueDate: "2025-05-20",
  },
  {
    id: "proj3",
    title: "Document Processing Automation",
    description: "AI-powered document processing and data extraction",
    status: "at-risk",
    progress: 40,
    team: ["John Doe", "Emily Chen"],
    dueDate: "2025-04-01",
  },
]

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("members")

  // Filter team members based on search query
  const filteredTeamMembers = mockTeamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Filter invitations based on search query
  const filteredInvitations = mockInvitations.filter(
    (invitation) =>
      invitation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invitation.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invitation.department.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Filter projects based on search query
  const filteredProjects = mockTeamProjects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.team.some((member) => member.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get status badge for projects
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
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-gray-500">Manage your team members and projects</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Team Member
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search team members, projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="members" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
          <TabsTrigger value="projects">Team Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {filteredTeamMembers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-gray-100 p-3 mb-4">
                  <UserPlus className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No team members found</h3>
                <p className="text-gray-500 text-center max-w-md">
                  {searchQuery
                    ? `No team members matching "${searchQuery}" were found.`
                    : "You don't have any team members yet."}
                </p>
                <Button className="mt-4">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 hidden md:table-cell">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 hidden lg:table-cell">
                      Department
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 hidden md:table-cell">
                      Projects
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 hidden lg:table-cell">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeamMembers.map((member, index) => (
                    <tr key={member.id} className={index !== filteredTeamMembers.length - 1 ? "border-b" : ""}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">{member.role}</td>
                      <td className="py-3 px-4 hidden lg:table-cell">{member.department}</td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{member.activeProjects}</span>
                          <span className="text-gray-500">active</span>
                          <span className="mx-1 text-gray-300">•</span>
                          <span className="font-medium">{member.completedProjects}</span>
                          <span className="text-gray-500">completed</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {member.status === "active" ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`mailto:${member.email}`}>
                              <Mail className="h-4 w-4" />
                              <span className="sr-only">Email</span>
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`tel:${member.phone}`}>
                              <Phone className="h-4 w-4" />
                              <span className="sr-only">Call</span>
                            </a>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Profile</DropdownMenuItem>
                              <DropdownMenuItem>Edit Role</DropdownMenuItem>
                              <DropdownMenuItem>Manage Projects</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          {filteredInvitations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-gray-100 p-3 mb-4">
                  <Mail className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No pending invitations</h3>
                <p className="text-gray-500 text-center max-w-md">
                  {searchQuery
                    ? `No invitations matching "${searchQuery}" were found.`
                    : "You don't have any pending team invitations."}
                </p>
                <Button className="mt-4">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 hidden md:table-cell">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 hidden lg:table-cell">
                      Department
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Sent Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvitations.map((invitation, index) => (
                    <tr key={invitation.id} className={index !== filteredInvitations.length - 1 ? "border-b" : ""}>
                      <td className="py-3 px-4">
                        <div className="font-medium">{invitation.email}</div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">{invitation.role}</td>
                      <td className="py-3 px-4 hidden lg:table-cell">{invitation.department}</td>
                      <td className="py-3 px-4">{formatDate(invitation.sentDate)}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm">
                            Resend
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-gray-100 p-3 mb-4">
                  <Plus className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No projects found</h3>
                <p className="text-gray-500 text-center max-w-md">
                  {searchQuery
                    ? `No projects matching "${searchQuery}" were found.`
                    : "You don't have any team projects yet."}
                </p>
                <Button className="mt-4" asChild>
                  <a href="/dashboard/opportunities">
                    <Plus className="mr-2 h-4 w-4" />
                    Start New Project
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm text-gray-500">Progress</div>
                          <div className="text-sm font-medium">{project.progress}%</div>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      <div>
                        <div className="text-sm text-gray-500 mb-1">Team</div>
                        <div className="flex flex-wrap gap-2">
                          {project.team.map((member, index) => (
                            <Badge key={index} variant="outline" className="bg-gray-50">
                              {member}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-500 mb-1">Due Date</div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(project.dueDate)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <div className="flex justify-between w-full">
                      {project.status === "at-risk" ? (
                        <Button variant="outline" size="sm" className="text-red-600">
                          <AlertCircle className="mr-2 h-4 w-4" />
                          View Issues
                        </Button>
                      ) : (
                        <div></div>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/dashboard/implementation/${project.id}`}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          View Details
                        </a>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
