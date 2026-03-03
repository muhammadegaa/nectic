"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import Link from "next/link"
import type { Agent } from "@/domain/entities/agent.entity"
import { DataPreview } from "@/components/agents/DataPreview"
import { useAgentAnalytics } from "@/presentation/hooks/use-agent-analytics"
import { AppNavigation } from "@/components/app-navigation"

const AVAILABLE_COLLECTIONS = [
  { id: "finance_transactions", label: "Finance Transactions" },
  { id: "sales_deals", label: "Sales Deals" },
  { id: "hr_employees", label: "HR Employees" },
]

const agentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  collections: z.array(z.string()).refine((value: string[]) => value.some((item) => item), {
    message: "You have to select at least one collection.",
  }),
  intents: z.array(
    z.object({
      keywords: z.string().min(1, "Keywords are required"),
      collection: z.string().min(1, "Collection is required"),
    })
  ).min(1, "Define at least one intent mapping"),
})

type AgentFormValues = z.infer<typeof agentSchema>

export default function EditAgentPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState("")
  const agentId = params.id as string

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: "",
      description: "",
      collections: [],
      intents: [{ keywords: "", collection: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "intents",
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && agentId) {
      fetchAgent()
    }
  }, [user, agentId])

  const fetchAgent = async () => {
    try {
      setFetchLoading(true)
      const response = await fetch(`/api/agents/${agentId}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch agent")
      }

      const agent: Agent = await response.json()

      // Verify ownership
      if (agent.userId !== user?.uid) {
        router.push("/dashboard")
        return
      }

      // Transform intentMappings to form format
      const intents = agent.intentMappings.length > 0
        ? agent.intentMappings.map((mapping) => ({
            keywords: mapping.keywords.join(", "),
            collection: mapping.collections[0] || "",
          }))
        : [{ keywords: "", collection: "" }]

      form.reset({
        name: agent.name,
        description: agent.description || "",
        collections: agent.collections,
        intents,
      })
    } catch (err: any) {
      setError(err.message || "Failed to load agent")
    } finally {
      setFetchLoading(false)
    }
  }

  async function onSubmit(data: AgentFormValues) {
    if (!user) return

    setIsLoading(true)
    setError("")

    try {
      // Transform intents to intentMappings format
      const intentMappings = data.intents.map((intent: { keywords: string; collection: string }) => ({
        intent: intent.keywords.split(",")[0].trim() || "general",
        keywords: intent.keywords.split(",").map((k) => k.trim()).filter((k) => k),
        collections: [intent.collection],
      }))

      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          collections: data.collections,
          intentMappings,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update agent")
      }

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to update agent")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !confirm("Are you sure you want to delete this agent?")) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete agent")
      }

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to delete agent")
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-foreground/60" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <div className="py-12 px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center text-foreground/60 hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <h1 className="text-4xl font-light text-foreground mb-8">Edit Agent</h1>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Agent Details</CardTitle>
              <CardDescription>
                Update your agent's name and data sources.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Finance Assistant"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this agent does..."
                  {...form.register("description")}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Data Collections</Label>
                  <div className="grid gap-2">
                    {AVAILABLE_COLLECTIONS.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={item.id}
                          checked={form.watch("collections")?.includes(item.id)}
                          onCheckedChange={(checked) => {
                            const current = form.watch("collections") || []
                            if (checked) {
                              form.setValue("collections", [...current, item.id])
                            } else {
                              form.setValue(
                                "collections",
                                current.filter((value: string) => value !== item.id)
                              )
                            }
                          }}
                        />
                        <Label htmlFor={item.id}>{item.label}</Label>
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.collections && (
                    <p className="text-sm text-destructive">{form.formState.errors.collections.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                Preview sample data from selected collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataPreview selectedCollections={form.watch("collections") || []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intent Mapping</CardTitle>
              <CardDescription>
                Define how user questions map to specific collections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-4 items-start p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex-1 space-y-2">
                    <Label>Keywords (comma separated)</Label>
                    <Textarea
                      placeholder="revenue, profit, sales, earnings"
                      {...form.register(`intents.${index}.keywords`)}
                    />
                    {form.formState.errors.intents?.[index]?.keywords && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.intents[index]?.keywords?.message}
                      </p>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label>Target Collection</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register(`intents.${index}.collection`)}
                    >
                      <option value="">Select a collection</option>
                      {AVAILABLE_COLLECTIONS.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.label}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.intents?.[index]?.collection && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.intents[index]?.collection?.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-8"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ keywords: "", collection: "" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Intent
              </Button>

              {form.formState.errors.intents && (
                <p className="text-sm text-destructive">{form.formState.errors.intents.message}</p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                Delete Agent
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-foreground text-background hover:bg-foreground/90">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </form>

        {/* Analytics Card */}
        <AgentAnalyticsCard agentId={agentId} />
        </div>
      </div>
    </div>
  )
}

function AgentAnalyticsCard({ agentId }: { agentId: string }) {
  const { analytics, loading } = useAgentAnalytics(agentId, true)

  if (loading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
          <CardDescription>View usage statistics for this agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return null
  }

  const feedbackTotal = analytics.positiveFeedbackCount + analytics.negativeFeedbackCount
  const feedbackTrend =
    feedbackTotal === 0
      ? "No feedback yet"
      : analytics.positiveFeedbackCount > analytics.negativeFeedbackCount * 2
      ? "Mostly positive"
      : analytics.negativeFeedbackCount > analytics.positiveFeedbackCount * 2
      ? "Mostly negative"
      : "Mixed"

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Usage Analytics</CardTitle>
        <CardDescription>View usage statistics for this agent</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground/60 mb-1">Total Queries</p>
              <p className="text-2xl font-light text-foreground">{analytics.totalQueries}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60 mb-1">Last Used</p>
              <p className="text-sm text-foreground/80">
                {analytics.lastUsedAt
                  ? formatDistanceToNow(new Date(analytics.lastUsedAt), { addSuffix: true })
                  : "Never"}
              </p>
              {analytics.lastUsedAt && (
                <p className="text-xs text-foreground/60 mt-1">
                  {format(new Date(analytics.lastUsedAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </div>
            {analytics.last7dQueries !== undefined && (
              <div>
                <p className="text-sm font-medium text-foreground/60 mb-1">Last 7 Days</p>
                <p className="text-sm text-foreground/80">{analytics.last7dQueries} queries</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground/60 mb-1">Feedback</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/80">👍 Positive</span>
                  <span className="text-sm font-medium text-foreground">{analytics.positiveFeedbackCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/80">👎 Negative</span>
                  <span className="text-sm font-medium text-foreground">{analytics.negativeFeedbackCount}</span>
                </div>
                {feedbackTotal > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-foreground/60">Trend: {feedbackTrend}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

