"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Share2, MessageSquare, Send, UserPlus, UploadCloud, File, Trash } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CommentType {
  id: string
  author: {
    name: string
    avatar?: string
    initials: string
  }
  text: string
  timestamp: string
}

interface TeamMemberType {
  id: string
  name: string
  role: string
  avatar?: string
  initials: string
}

interface CollaborationToolsProps {
  opportunityId: string
  opportunityName: string
}

export function CollaborationTools({ opportunityId, opportunityName }: CollaborationToolsProps) {
  const [comments, setComments] = useState<CommentType[]>([
    {
      id: "1",
      author: {
        name: "Sarah Johnson",
        initials: "SJ",
      },
      text: "I think we should focus on the implementation of this opportunity in Q3 to align with our strategic goals.",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      author: {
        name: "Michael Chen",
        initials: "MC",
      },
      text: "Agreed. We should also consider involving the operations team early in the process.",
      timestamp: "5 hours ago",
    },
  ])

  const [newComment, setNewComment] = useState("")
  const [teamMembers, setTeamMembers] = useState<TeamMemberType[]>([
    {
      id: "1",
      name: "John Doe",
      role: "Project Lead",
      initials: "JD",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      role: "Finance Analyst",
      initials: "SJ",
    },
    {
      id: "3",
      name: "Michael Chen",
      role: "IT Manager",
      initials: "MC",
    },
  ])
  const [newMemberRole, setNewMemberRole] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: CommentType = {
      id: Date.now().toString(),
      author: {
        name: "You",
        initials: "YO",
      },
      text: newComment,
      timestamp: "Just now",
    }

    setComments([...comments, comment])
    setNewComment("")
  }

  const handleShare = () => {
    // In a real implementation, this would open a share dialog
    alert(`Sharing ${opportunityName} opportunity...`)
  }

  const handleAddTeamMember = () => {
    // In a real implementation, this would open a dialog to add team members
    alert("Add team member functionality would be implemented here")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // In a real implementation, this would upload the file to a server
      // For now, just add the file name to the list
      const newFiles = Array.from(files).map((file) => file.name)
      setUploadedFiles([...uploadedFiles, ...newFiles])
    }
  }

  const handleDeleteFile = (fileName: string) => {
    setUploadedFiles(uploadedFiles.filter((file) => file !== fileName))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Collaboration</h3>

        <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share with Team
        </Button>
      </div>

      {/* Comments Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Team Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  {comment.author.avatar && <AvatarImage src={comment.author.avatar} alt={comment.author.name} />}
                  <AvatarFallback>{comment.author.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm mt-1">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>YO</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleAddComment()
                  }
                }}
              />
              <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Team Members
            </div>
            <Button size="sm" onClick={handleAddTeamMember} variant="ghost">
              Add Member
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.role}</div>
                  </div>
                </div>

                <Select defaultValue={member.id === "1" ? "responsible" : "informed"}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="responsible">Responsible</SelectItem>
                    <SelectItem value="accountable">Accountable</SelectItem>
                    <SelectItem value="consulted">Consulted</SelectItem>
                    <SelectItem value="informed">Informed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UploadCloud className="h-4 w-4" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-md p-6 text-center mb-4">
            <UploadCloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm mb-2">Drag and drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mb-4">Maximum file size: 10MB</p>
            <Button asChild size="sm" variant="secondary">
              <label>
                Browse Files
                <input type="file" className="sr-only" multiple onChange={handleFileUpload} />
              </label>
            </Button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-medium">Uploaded Documents</h4>
              {uploadedFiles.map((fileName, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                  <div className="flex items-center gap-2 text-sm">
                    <File className="h-4 w-4 text-primary" />
                    {fileName}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteFile(fileName)}>
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
