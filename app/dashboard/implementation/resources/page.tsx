"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, FileText, LinkIcon, Search, Video } from "lucide-react"

// Sample resources data
const resourcesData = [
  {
    id: "1",
    title: "AI Implementation Guide",
    description: "Step-by-step guide for implementing AI solutions in your business",
    type: "guide",
    category: "Implementation",
    url: "#",
    date: "2024-01-15",
  },
  {
    id: "2",
    title: "Vendor Selection Framework",
    description: "Framework for evaluating and selecting AI vendors",
    type: "template",
    category: "Vendor Management",
    url: "#",
    date: "2024-02-10",
  },
  {
    id: "3",
    title: "ROI Calculation Spreadsheet",
    description: "Template for calculating ROI of AI implementations",
    type: "template",
    category: "ROI",
    url: "#",
    date: "2024-01-05",
  },
  {
    id: "4",
    title: "AI Implementation Case Study: Retail",
    description: "Case study of successful AI implementation in retail",
    type: "case-study",
    category: "Case Studies",
    url: "#",
    date: "2024-02-20",
  },
  {
    id: "5",
    title: "AI Implementation Webinar",
    description: "Recorded webinar on AI implementation best practices",
    type: "video",
    category: "Training",
    url: "#",
    date: "2024-01-25",
  },
  {
    id: "6",
    title: "Change Management for AI",
    description: "Guide for managing organizational change during AI implementation",
    type: "guide",
    category: "Change Management",
    url: "#",
    date: "2024-02-05",
  },
]

export default function ResourcesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [resources, setResources] = useState(resourcesData)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const filteredResources = resources.filter(
    (resource) =>
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getIconForType = (type: string) => {
    switch (type) {
      case "guide":
      case "template":
        return <FileText className="h-5 w-5" />
      case "case-study":
        return <BookOpen className="h-5 w-5" />
      case "video":
        return <Video className="h-5 w-5" />
      default:
        return <LinkIcon className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Implementation Resources</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Implementation Resources</h1>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search resources..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="case-studies">Case Studies</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="mb-2">
                      {resource.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription>{resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{resource.description}</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={resource.url} className="flex items-center justify-center">
                      {getIconForType(resource.type)}
                      <span className="ml-2">View Resource</span>
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="guides" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources
              .filter((resource) => resource.type === "guide")
              .map((resource) => (
                <Card key={resource.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="mb-2">
                        {resource.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{resource.description}</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button asChild variant="outline" className="w-full">
                      <Link href={resource.url} className="flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                        <span className="ml-2">View Guide</span>
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources
              .filter((resource) => resource.type === "template")
              .map((resource) => (
                <Card key={resource.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="mb-2">
                        {resource.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{resource.description}</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button asChild variant="outline" className="w-full">
                      <Link href={resource.url} className="flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                        <span className="ml-2">Download Template</span>
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="case-studies" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources
              .filter((resource) => resource.type === "case-study")
              .map((resource) => (
                <Card key={resource.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="mb-2">
                        {resource.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{resource.description}</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button asChild variant="outline" className="w-full">
                      <Link href={resource.url} className="flex items-center justify-center">
                        <BookOpen className="h-5 w-5" />
                        <span className="ml-2">Read Case Study</span>
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources
              .filter((resource) => resource.type === "video")
              .map((resource) => (
                <Card key={resource.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="mb-2">
                        {resource.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{resource.description}</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button asChild variant="outline" className="w-full">
                      <Link href={resource.url} className="flex items-center justify-center">
                        <Video className="h-5 w-5" />
                        <span className="ml-2">Watch Video</span>
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
