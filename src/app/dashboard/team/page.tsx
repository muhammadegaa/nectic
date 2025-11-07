"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, UserPlus, Mail, Phone, MapPin, Calendar, Briefcase, Award, Users, UserCheck, UserX } from "lucide-react"

// Mock team data
const teamMembers = [
  {
    id: "user1",
    name: "John Doe",
    role: "AI Implementation Lead",
    department: "Technology",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    joinDate: "2022-01-15",
    projects: 5,
    status: "active",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    id: "user2",
    name: "Sarah Smith",
    role: "Data Scientist",
    department: "Analytics",
    email: "sarah.smith@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    joinDate: "2022-03-22",
    projects: 3,
    status: "active",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    id: "user3",
    name: "Michael Johnson",
    role: "Project Manager",
    department: "Operations",
    email: "michael.johnson@example.com",
    phone: "+1 (555) 345-6789",
    location: "Chicago, IL",
    joinDate: "2022-05-10",
    projects: 4,
    status: "active",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
  },
  {
    id: "user4",
    name: "Emily Davis",
    role: "AI Engineer",
    department: "Technology",
    email: "emily.davis@example.com",
    phone: "+1 (555) 456-7890",
    location: "Boston, MA",
    joinDate: "2022-07-18",
    projects: 2,
    status: "active",
    avatar: "https://randomuser.me/api/portraits/women/4.jpg",
  },
  {
    id: "user5",
    name: "Robert Wilson",
    role: "Business Analyst",
    department: "Analytics",
    email: "robert.wilson@example.com",
    phone: "+1 (555) 567-8901",
    location: "Austin, TX",
    joinDate: "2022-09-05",
    projects: 3,
    status: "inactive",
    avatar: "https://randomuser.me/api/portraits/men/5.jpg",
  },
  {
    id: "user6",
    name: "Lisa Brown",
    role: "UX Designer",
    department: "Design",
    email: "lisa.brown@example.com",
    phone: "+1 (555) 678-9012",
    location: "Seattle, WA",
    joinDate: "2022-11-12",
    projects: 4,
    status: "active",
    avatar: "https://randomuser.me/api/portraits/women/6.jpg",
  },
]

// Mock department data
const departments = [
  {
    name: "Technology",
    count: 12,
    lead: "John Doe",
  },
  {
    name: "Analytics",
    count: 8,
    lead: "Sarah Smith",
  },
  {
    name: "Operations",
    count: 6,
    lead: "Michael Johnson",
  },
  {
    name: "Design",
    count: 4,
    lead: "Lisa Brown",
  },
]

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter team members based on search query and active tab
  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === "all" || member.status === activeTab
    return matchesSearch && matchesTab
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Team</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search team members..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Members</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.role}</p>
                      <div className="flex items-center mt-1">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-1 ${
                            member.status === "active" ? "bg-green-500" : "bg-gray-400"
                          }`}
                        ></span>
                        <span className="text-xs text-gray-500 capitalize">{member.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.phone}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.location}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.department}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Joined: {member.joinDate}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Award className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.projects} Projects</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Mail className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.role}</p>
                      <div className="flex items-center mt-1">
                        <span className="inline-block w-2 h-2 rounded-full mr-1 bg-green-500"></span>
                        <span className="text-xs text-gray-500">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.phone}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.location}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.department}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Joined: {member.joinDate}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Award className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.projects} Projects</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Mail className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-16 h-16 rounded-full object-cover opacity-70"
                    />
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.role}</p>
                      <div className="flex items-center mt-1">
                        <span className="inline-block w-2 h-2 rounded-full mr-1 bg-gray-400"></span>
                        <span className="text-xs text-gray-500">Inactive</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.phone}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.location}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.department}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Joined: {member.joinDate}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Award className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{member.projects} Projects</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      <UserCheck className="h-4 w-4 mr-1" />
                      Reactivate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {departments.map((dept) => (
              <Card key={dept.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{dept.name}</h3>
                      <p className="text-sm text-gray-500">{dept.count} Members</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Lead: {dept.lead}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}