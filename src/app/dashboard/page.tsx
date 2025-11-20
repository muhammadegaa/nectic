"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, MessageSquare, Loader2, ArrowRight, FileText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Agent } from "@/domain/entities/agent.entity"
import { useAgentAnalytics } from "@/presentation/hooks/use-agent-analytics"

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
    <Card className="hover:border-foreground/20 transition-colors">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-medium text-foreground mb-1">
              {agent.name}
            </CardTitle>
            {agent.description && (
              <CardDescription className="mt-2">{agent.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-foreground/60 mb-1">Collections</p>
            <div className="flex flex-wrap gap-2">
              {agent.collections.map((col) => (
                <span
                  key={col}
                  className="text-xs px-2 py-1 bg-muted rounded-md text-foreground/70"
                >
                  {col.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-foreground/60 mb-1">Intent Mappings</p>
            <p className="text-sm text-foreground/80">{agent.intentMappings.length} configured</p>
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
        </div>
      </CardContent>
                <CardContent className="pt-0 space-y-2">
                  <Link href={`/agents/${agent.id}/chat`}>
                    <Button
                      variant="outline"
                      className="w-full group"
                    >
                      Open Chat
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={generateOpportunityReport}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    {isGeneratingReport ? "Generating..." : "AI Report"}
                  </Button>
                  <Link href={`/agents/${agent.id}/edit`}>
                    <Button
                      variant="ghost"
                      className="w-full text-sm"
                    >
                      Edit
                    </Button>
                  </Link>
                </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-5 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Agent Cards Skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-full" />
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
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-light text-foreground mb-2">Dashboard</h1>
            <p className="text-foreground/60">Manage your AI agents</p>
          </div>
          <Button
            onClick={() => router.push("/agents/new")}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Agent
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        {/* Agents List */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            {error}
          </div>
        )}

        {agents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="w-12 h-12 text-foreground/20 mb-4" />
              <h3 className="text-xl font-light text-foreground mb-2">No agents yet</h3>
              <p className="text-foreground/60 mb-6 text-center max-w-md">
                Create your first AI agent to get started. Agents connect to your databases and answer questions in natural language.
              </p>
              <Button
                onClick={() => router.push("/agents/new")}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

