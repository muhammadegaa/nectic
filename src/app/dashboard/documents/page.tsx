"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Star, FileText, Download, Share2, Search, Grid, List } from "lucide-react"

interface Document {
  id: string
  name: string
  type: string
  size: string
  lastModified: string
  starred: boolean
  category: string
}

const documents: Document[] = [
  {
    id: "1",
    name: "AI Implementation Guide",
    type: "PDF",
    size: "2.4 MB",
    lastModified: "2023-06-15",
    starred: true,
    category: "Implementation"
  },
  {
    id: "2",
    name: "ROI Calculation Template",
    type: "XLSX",
    size: "1.8 MB",
    lastModified: "2023-06-14",
    starred: true,
    category: "Finance"
  },
  {
    id: "3",
    name: "Customer Service Automation Plan",
    type: "PDF",
    size: "3.2 MB",
    lastModified: "2023-06-10",
    starred: false,
    category: "Planning"
  },
  {
    id: "4",
    name: "Implementation Checklist",
    type: "DOCX",
    size: "0.8 MB",
    lastModified: "2023-06-08",
    starred: false,
    category: "Implementation"
  },
  {
    id: "5",
    name: "AI Integration Best Practices",
    type: "PDF",
    size: "4.1 MB",
    lastModified: "2023-06-05",
    starred: true,
    category: "Guidelines"
  },
  {
    id: "6",
    name: "Team Training Materials",
    type: "PPTX",
    size: "5.6 MB",
    lastModified: "2023-06-03",
    starred: false,
    category: "Training"
  }
]

const recentDocuments = documents.slice(0, 3)

const categories = Array.from(new Set(documents.map(doc => doc.category)))

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeTab === "all" || doc.category.toLowerCase() === activeTab.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const DocumentCard = ({ document }: { document: Document }) => {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">{document.name}</h3>
              <div className="flex items-center text-sm text-gray-500 space-x-2">
                <span>{document.type}</span>
                <span>•</span>
                <span>{document.size}</span>
              </div>
            </div>
          </div>
          <button
            className="text-gray-400 hover:text-amber-500 transition-colors"
            onClick={() => {/* Toggle star */}}
          >
            <Star className={document.starred ? "fill-amber-400 text-amber-400" : ""} />
          </button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {new Date(document.lastModified).toLocaleDateString()}
          </span>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">Documents</h1>
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[300px]"
            />
          </div>
          <div className="flex items-center space-x-1 border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all" onClick={() => setActiveTab("all")}>
            All Documents
          </TabsTrigger>
          {categories.map(category => (
            <TabsTrigger
              key={category}
              value={category.toLowerCase()}
              onClick={() => setActiveTab(category.toLowerCase())}
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className={`grid gap-4 ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          }`}>
            {filteredDocuments.map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </TabsContent>

        {categories.map(category => (
          <TabsContent key={category} value={category.toLowerCase()} className="mt-0">
            <div className={`grid gap-4 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}>
              {filteredDocuments
                .filter(doc => doc.category === category)
                .map(doc => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}