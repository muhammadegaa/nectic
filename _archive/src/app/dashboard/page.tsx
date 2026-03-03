"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, MessageSquare, Loader2, ArrowRight, FileText, Search, X, Sparkles, TrendingUp, Activity, Clock } from "lucide-react"
import { AppNavigation } from "@/components/app-navigation"
import { formatDistanceToNow } from "date-fns"
import type { Agent } from "@/domain/entities/agent.entity"
import { useAgentAnalytics } from "@/presentation/hooks/use-agent-analytics"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

function AgentCard({ agent }: { agent: Agent }) {
  const { analytics, loading: analyticsLoading } = useAgentAnalytics(agent.id, true)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const { toast } = useToast()

  const generateOpportunityReport = async () => {
    setIsGeneratingReport(true)
    try {
      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/agents/${agent.id}/opportunity-report`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to generate report")
      }

      const data = await response.json()
      
      // Create markdown file and download
      const blob = new Blob([data.report], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-opportunity-report-${agent.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Report Generated",
        description: "AI Opportunity Report downloaded successfully",
      })
    } catch (error: any) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  return (
    <Card className="hover:border-foreground/20 transition-colors h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl font-medium text-foreground mb-1 truncate">
              {agent.name}
            </CardTitle>
            {agent.description && (
              <CardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm line-clamp-2">{agent.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-3">
        <div>
          <p className="text-xs sm:text-sm text-foreground/60 mb-1.5">Collections</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {agent.collections.map((col) => (
              <span
                key={col}
                className="text-xs px-2 py-0.5 sm:py-1 bg-muted rounded-md text-foreground/70"
              >
                {col.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-foreground/60 mb-1">Intent Mappings</p>
          <p className="text-xs sm:text-sm text-foreground/80">{agent.intentMappings.length} configured</p>
        </div>
        {/* Analytics */}
        {!analyticsLoading && analytics && (
          <div className="pt-2 border-t border-border space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/60">Last used:</span>
              <span className="text-foreground/80">
                {analytics.lastUsedAt
                  ? formatDistanceToNow(new Date(analytics.lastUsedAt), { addSuffix: true })
                  : "Never"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/60">Queries:</span>
              <span className="text-foreground/80">{analytics.totalQueries}</span>
            </div>
            {(analytics.positiveFeedbackCount > 0 || analytics.negativeFeedbackCount > 0) && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/60">Feedback:</span>
                <span className="text-foreground/80">
                  {analytics.positiveFeedbackCount} 👍 / {analytics.negativeFeedbackCount} 👎
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardContent className="pt-0 space-y-2 mt-auto">
        <Link href={`/agents/${agent.id}/chat`} className="block">
          <Button
            variant="outline"
            className="w-full group h-9 sm:h-10 text-sm"
          >
            Open Chat
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
        <Button
          variant="outline"
          className="w-full text-xs sm:text-sm h-9 sm:h-10"
          onClick={generateOpportunityReport}
          disabled={isGeneratingReport}
        >
          {isGeneratingReport ? (
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          )}
          {isGeneratingReport ? "Generating..." : "AI Report"}
        </Button>
        <Link href={`/agents/${agent.id}/edit`} className="block">
          <Button
            variant="ghost"
            className="w-full text-xs sm:text-sm h-9 sm:h-10"
          >
            Edit Agent
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

import Image from "next/image"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCollection, setFilterCollection] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "recent" | "queries">("recent")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchAgents()
    }
  }, [user])

  const fetchAgents = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/agents`, {
        headers,
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch agents")
      }

      const data = await response.json()
      setAgents(data)
    } catch (err: any) {
      setError(err.message || "Failed to load agents")
    } finally {
      setLoading(false)
    }
  }

  // Get all unique collections for filter
  const allCollections = Array.from(new Set(agents.flatMap((a) => a.collections))).sort()

  // Filter and sort agents
  const filteredAndSortedAgents = agents
    .filter((agent) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.collections.some((col) => col.toLowerCase().includes(searchQuery.toLowerCase()))

      // Collection filter
      const matchesCollection =
        filterCollection === "all" || agent.collections.includes(filterCollection)

      return matchesSearch && matchesCollection
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "recent") {
        // Sort by creation date (newest first) - using id as proxy since we don't have createdAt
        return b.id.localeCompare(a.id)
      } else {
        // Sort by queries - would need analytics data, for now use name
        return a.name.localeCompare(b.name)
      }
    })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="space-y-6 sm:space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-2">
                <Skeleton className="h-8 sm:h-10 w-40 sm:w-48" />
                <Skeleton className="h-4 sm:h-5 w-48 sm:w-64" />
              </div>
              <Skeleton className="h-10 w-full sm:w-32" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24 sm:w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12 sm:w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Agent Cards Skeleton */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 sm:h-6 w-28 sm:w-32 mb-2" />
                    <Skeleton className="h-3 sm:h-4 w-full" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20 sm:w-24" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                        <Skeleton className="h-5 sm:h-6 w-20 sm:w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-9 sm:h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation breadcrumbs={[{ label: "Dashboard" }]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-foreground mb-1 sm:mb-2">Dashboard</h1>
              <p className="text-sm sm:text-base text-foreground/60">Manage your AI agents</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              asChild
              className="bg-foreground text-background hover:bg-foreground/90 h-10 sm:h-9"
            >
              <Link href="/upload">
                <FileText className="w-4 h-4 mr-2" />
                Upload Excel
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/agents/new")}
              className="h-10 sm:h-9"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Agent
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground/60">Total Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-light text-foreground">{agents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground/60">Active Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-light text-foreground">
                {new Set(agents.flatMap((a) => a.collections)).size}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground/60">Intent Mappings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-light text-foreground">
                {agents.reduce((sum, a) => sum + a.intentMappings.length, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        {agents.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <Input
                  type="text"
                  placeholder="Search agents by name, description, or collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-10"
                  aria-label="Search agents"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/40 hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Collection Filter */}
              {allCollections.length > 0 && (
                <Select value={filterCollection} onValueChange={setFilterCollection}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10">
                    <SelectValue placeholder="Filter by collection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Collections</SelectItem>
                    {allCollections.map((collection) => (
                      <SelectItem key={collection} value={collection}>
                        {collection.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-full sm:w-[140px] h-10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="queries">Most Queries</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results count - only show when filters are active */}
            {(searchQuery || filterCollection !== "all") && filteredAndSortedAgents.length > 0 && (
              <div className="text-sm text-foreground/60">
                Showing {filteredAndSortedAgents.length} of {agents.length} agents
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setFilterCollection("all")
                  }}
                  className="ml-2 text-foreground hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-destructive mb-1">Failed to load agents</h3>
                  <p className="text-sm text-destructive/80 mb-4">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAgents}
                    className="text-sm"
                  >
                    <Loader2 className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty States */}
        {agents.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-20 px-4">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
                <Sparkles className="w-16 h-16 sm:w-20 sm:h-20 text-primary relative z-10" />
              </div>
              <h3 className="text-xl sm:text-2xl font-light text-foreground mb-2 text-center">
                Get answers in 30 seconds
              </h3>
              <p className="text-foreground/60 mb-2 text-center max-w-md text-sm sm:text-base">
                Upload Excel or CSV. Ask a question. Get the answer. No setup.
              </p>
              <p className="text-foreground/40 mb-6 text-center max-w-md text-xs sm:text-sm">
                Or create an agent for advanced configuration.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  className="bg-foreground text-background hover:bg-foreground/90 h-10 px-6"
                  size="lg"
                >
                  <Link href="/upload">
                    <FileText className="w-4 h-4 mr-2" />
                    Upload Excel
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/agents/new")}
                  size="lg"
                  className="h-10 px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredAndSortedAgents.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-4">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2 text-center">
                No agents match your filters
              </h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Try adjusting your search query or collection filter to see more results.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setFilterCollection("all")
                }}
                className="h-9"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-foreground/60 mb-4">
              Showing {filteredAndSortedAgents.length} of {agents.length} agents
            </p>
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  )
}

