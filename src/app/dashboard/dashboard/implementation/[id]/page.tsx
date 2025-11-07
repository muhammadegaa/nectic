"use client"

import { useState, useEffect } from "react"
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
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useMediaQuery } from "@/hooks/use-media-query"
import { getProjectById, updateProject } from "@/lib/opportunities-service"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [project, setProject] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [progressValue, setProgressValue] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [newUpdate, setNewUpdate] = useState({ title: "", content: "" })
  const [error, setError] = useState<string | null>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editProjectData, setEditProjectData] = useState({
    title: "",
    description: "",
    status: "",
  })

  const projectId = params.id as string

  // Load project data
  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true)
        const projectData = await getProjectById(projectId)

        if (projectData) {
          setProject(projectData)
          setProgressValue(projectData.progress)
        } else {
          setError("Project not found")
        }
      } catch (err) {
        console.error("Error loading project:", err)
        setError("Failed to load project details")
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadProject()
    }
  }, [projectId])

  // Update project progress
  const updateProgress = async () => {
    if (!project) return

    try {
      setIsSaving(true)

      const updatedProject = await updateProject(project.id, {
        progress: progressValue,
      })

      if (updatedProject) {
        setProject(updatedProject)

        toast({
          title: "Progress updated",
          description: `Project progress updated to ${progressValue}%`,
        })
      } else {
        throw new Error("Failed to update progress")
      }
    } catch (err) {
      console.error("Error updating progress:", err)

      toast({
        title: "Update failed",
        description: "Failed to update project progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Add new update
  const addUpdate = async () => {
    if (!project || !newUpdate.content.trim()) return

    try {
      setIsSaving(true)

      const updatedProject = await updateProject(project.id, {
        updates: [
          {
            id: `update${project.updates.length + 1}`,
            date: new Date().toISOString().split("T")[0],
            author: "Current User",
            content: newUpdate.content,
          },
          ...project.updates,
        ],
      })

      if (updatedProject) {
        setProject(updatedProject)
        setNewUpdate({ title: "", content: "" })
        setUpdateDialogOpen(false)

        toast({
          title: "Update added",
          description: "Your update has been added to the project",
        })
      } else {
        throw new Error("Failed to add update")
      }
    } catch (err) {
      console.error("Error adding update:", err)

      toast({
        title: "Update failed",
        description: "Failed to add update. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditProject = async () => {
    if (!project) return

    try {
      setIsSaving(true)

      const updatedProject = await updateProject(project.id, {
        title: editProjectData.title,
        description: editProjectData.description,
        status: editProjectData.status,
      })

      if (updatedProject) {
        setProject(updatedProject)
        setEditDialogOpen(false)

        toast({
          title: "Project updated",
          description: "Project details have been successfully updated",
        })
      } else {
        throw new Error("Failed to update project")
      }
    } catch (err) {
      console.error("Error updating project:", err)

      toast({
        title: "Update failed",
        description: "Failed to update project details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (project) {
      setEditProjectData({
        title: project.title || "",
        description: project.description || "",
        status: project.status || "",
      })
    }
  }, [project])

    const handleEditTask = (taskId: string) => {
    // Implementation for editing a task would go here
    toast({
      title: "Edit Task",
      description: `Editing task ${taskId}`,
    })
  }

  const handleDeleteTask = (taskId: string) => {
    // Implementation for deleting a task would go here
    toast({
      title: "Delete Task",
      description: `Deleting task ${taskId}`,
    })
  }

  const toggleProjectStatus = async () => {
    try {
      setIsSaving(true)

      const newStatus = project.status === "in-progress" ? "on-hold" : "in-progress"

      const updatedProject = await updateProject(project.id, {
        status: newStatus,
      })

      if (updatedProject) {
        setProject(updatedProject)

        toast({
          title: newStatus === "on-hold" ? "Project paused" : "Project resumed",
          description: `Project status updated to ${newStatus === "on-hold" ? "on hold" : "in progress"}`,
        })
      } else {
        throw new Error("Failed to update project status")
      }
    } catch (err) {
      console.error("Error updating project status:", err)

      toast({
        title: "Update failed",
        description: "Failed to update project status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
        <p className="text-gray-500 mb-6">
          {error || "The project you're looking for doesn't exist or has been removed."}
        </p>
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
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/implementation")}
          className="mb-4 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
        >
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

          <div className="flex flex-wrap items-center gap-2">
            {project.status === "in-progress" ? (
              <Button
                variant="outline"
                className={isMobile ? "w-full" : ""}
                onClick={toggleProjectStatus}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Updating...
                  </>
                ) : (
                  <>
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Pause Project
                  </>
                )}
              </Button>
            ) : project.status === "on-hold" ? (
              <Button
                variant="outline"
                className={isMobile ? "w-full" : ""}
                onClick={toggleProjectStatus}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Updating...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Resume Project
                  </>
                )}
              </Button>
            ) : null}

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className={`${isMobile ? "w-full" : ""} transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md`}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Project</DialogTitle>
                  <DialogDescription>Make changes to your project details below.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-title">Project Title</Label>
                    <Input
                      id="project-title"
                      value={editProjectData.title}
                      onChange={(e) => setEditProjectData({ ...editProjectData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-description">Description</Label>
                    <Textarea
                      id="project-description"
                      rows={3}
                      value={editProjectData.description}
                      onChange={(e) => setEditProjectData({ ...editProjectData, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-status">Status</Label>
                    <Select
                      value={editProjectData.status}
                      onValueChange={(value) => setEditProjectData({ ...editProjectData, status: value })}
                    >
                      <SelectTrigger id="project-status">
                        <span className="capitalize">{editProjectData.status.replace("-", " ")}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    className="transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditProject}
                    disabled={isSaving}
                    className="transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start md:justify-center">
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
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{progressValue}%</span>
                    </div>
                    <div className="space-y-3">
                      <Progress value={progressValue} className="h-2" />
                      <div className="flex flex-col gap-2">
                        <Slider
                          value={[progressValue]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(value) => setProgressValue(value[0])}
                          className="w-full"
                        />
                        <Button
                          size="sm"
                          onClick={updateProgress}
                          className="self-end transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <LoadingSpinner size="sm" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Progress
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Team Members</div>
                    <div className="flex flex-wrap gap-2">
                      {project.team.map((member: string, index: number) => (
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
                        {project.tasks.filter((t: any) => t.status === "completed").length}
                      </div>
                      <div className="text-sm text-green-600">Completed</div>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-md">
                      <div className="text-2xl font-bold text-amber-700">
                        {project.tasks.filter((t: any) => t.status === "in-progress").length}
                      </div>
                      <div className="text-sm text-amber-600">In Progress</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-2xl font-bold text-gray-700">
                        {project.tasks.filter((t: any) => t.status === "not-started").length}
                      </div>
                      <div className="text-sm text-gray-600">Not Started</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Recent Tasks</div>
                    <div className="space-y-2">
                      {project.tasks.slice(0, 3).map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center gap-2">
                            {getTaskStatusIcon(task.status)}
                            <span className="text-sm">{task.title}</span>
                          </div>
                          <div className="text-xs text-gray-500">Due: {formatDate(task.dueDate)}</div>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-sm transition-all duration-200 hover:bg-gray-100 hover:scale-110"
                        asChild
                      >
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
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Updates</CardTitle>
                <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Project Update</DialogTitle>
                      <DialogDescription>
                        Share progress, challenges, or important information about the project.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="update-title">Title</Label>
                        <Input
                          id="update-title"
                          placeholder="Brief title for your update"
                          value={newUpdate.title}
                          onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="update-content">Update Details</Label>
                        <Textarea
                          id="update-content"
                          placeholder="Describe the update in detail..."
                          rows={5}
                          value={newUpdate.content}
                          onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setUpdateDialogOpen(false)}
                        className="transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={addUpdate}
                        disabled={!newUpdate.content.trim() || isSaving}
                        className="transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
                      >
                        {isSaving ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Posting...
                          </>
                        ) : (
                          "Post Update"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.updates.slice(0, 2).map((update: any) => (
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm transition-all duration-200 hover:bg-gray-100 hover:scale-110"
                    asChild
                  >
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
                    {project.risks.map((risk: any) => (
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
              <Button size="sm" className="transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="text-2xl font-bold text-green-700">
                      {project.tasks.filter((t: any) => t.status === "completed").length}
                    </div>
                    <div className="text-sm text-green-600">Completed</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-md">
                    <div className="text-2xl font-bold text-amber-700">
                      {project.tasks.filter((t: any) => t.status === "in-progress").length}
                    </div>
                    <div className="text-sm text-amber-600">In Progress</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-2xl font-bold text-gray-700">
                      {project.tasks.filter((t: any) => t.status === "not-started").length}
                    </div>
                    <div className="text-sm text-gray-600">Not Started</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
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
                        {project.tasks.map((task: any) => (
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 transition-all duration-200 hover:bg-gray-100 hover:scale-110"
                                onClick={() => handleEditTask(task.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 transition-all duration-200 hover:bg-gray-100 hover:scale-110"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Team Members</CardTitle>
              <Button size="sm" className="transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.team.map((member: string, index: number) => (
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 transition-all duration-200 hover:bg-gray-100 hover:scale-110"
                      >
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
              <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Update
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Project Update</DialogTitle>
                    <DialogDescription>
                      Share progress, challenges, or important information about the project.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="update-title-full">Title</Label>
                      <Input
                        id="update-title-full"
                        placeholder="Brief title for your update"
                        value={newUpdate.title}
                        onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="update-content-full">Update Details</Label>
                      <Textarea
                        id="update-content-full"
                        placeholder="Describe the update in detail..."
                        rows={5}
                        value={newUpdate.content}
                        onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setUpdateDialogOpen(false)}
                      className="transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={addUpdate}
                      disabled={!newUpdate.content.trim() || isSaving}
                      className="transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Posting...
                        </>
                      ) : (
                        "Post Update"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {project.updates.map((update: any) => (
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
              <Button size="sm" className="transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md">
                <PlusCircle className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Document
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Type
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Uploaded By
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Upload Date
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
                      {project.documents.map((doc: any) => (
                        <tr key={doc.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getDocumentIcon(doc.type)}
                              <span className="ml-2 text-sm font-medium">{doc.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">{doc.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">{getInitials(doc.uploadedBy)}</AvatarFallback>
                              </Avatar>
                              <span className="ml-2 text-sm text-gray-500">{doc.uploadedBy}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(doc.uploadDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 transition-all duration-200 hover:bg-gray-100 hover:scale-110"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 transition-all duration-200 hover:bg-gray-100 hover:scale-110"
                            >
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

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Project Risks</CardTitle>
              <Button size="sm" className="transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Risk
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.risks.map((risk: any) => (
                  <div
                    key={risk.id}
                    className={`p-4 rounded-md ${
                      risk.severity === "high" ? "bg-red-50" : risk.severity === "medium" ? "bg-amber-50" : "bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
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
                      </div>
                      <Badge
                        className={`${
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
                      <div className="text-sm font-medium mb-1">Mitigation Strategy</div>
                      <p className="text-sm">{risk.mitigation}</p>
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
