"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Trash2, Loader2, ArrowLeft, ArrowRight, ChevronDown, Settings, Zap, Workflow, Play } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { DataPreview } from "@/components/agents/DataPreview"
import { DatabaseConnectionForm } from "@/components/agents/DatabaseConnection"
import { AgenticConfigForm } from "@/components/agents/AgenticConfig"
import { AgentPreview } from "@/components/agents/AgentPreview"
import { AppNavigation } from "@/components/app-navigation"
import { ToolMarketplace } from "@/components/agents/ToolMarketplace"
import { VisualWorkflowBuilder } from "@/components/agents/VisualWorkflowBuilder"
import { AgentConfiguration } from "@/components/agents/AgentConfiguration"
import { OAuthConnections } from "@/components/agents/OAuthConnections"
import type { DatabaseConnection } from "@/lib/db-adapters/base-adapter"
import type { AgenticConfig } from "@/domain/entities/agent.entity"
import type { Node, Edge } from "reactflow"

const AVAILABLE_COLLECTIONS = [
  { id: "finance_transactions", label: "Finance Transactions", description: "Financial transactions data" },
  { id: "sales_deals", label: "Sales Deals", description: "Sales pipeline and deals" },
  { id: "hr_employees", label: "HR Employees", description: "Employee records" },
]

export default function NewAgentPage() {

  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [intentMappings, setIntentMappings] = useState<Array<{ intent: string; keywords: string; collections: string[] }>>([])
  const [databaseConnection, setDatabaseConnection] = useState<DatabaseConnection | null>(null)
  const [agenticConfig, setAgenticConfig] = useState<Partial<AgenticConfig> | undefined>(undefined)
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set())
  const [workflowNodes, setWorkflowNodes] = useState<Node[]>([])
  const [workflowEdges, setWorkflowEdges] = useState<Edge[]>([])
  const [connectedOAuthProviders, setConnectedOAuthProviders] = useState<string[]>([])
  const [agentConfig, setAgentConfig] = useState<any>({
    model: { provider: 'openai', model: 'gpt-4', temperature: 0.7, maxTokens: 2000 },
    systemPrompt: '',
    memory: { type: 'session', maxTurns: 20, enableLearning: false },
    deployment: { channels: ['web'] }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const STORAGE_KEY = 'nectic_agent_draft'

  // Wait for auth to be ready before checking user
  // This prevents redirecting to login when auth is still restoring from persistence
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [authLoading, user, router])

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthSuccess = params.get('oauth_success')
    const oauthError = params.get('error')
    
    if (oauthSuccess) {
      toast({
        title: "Connection Successful",
        description: `Successfully connected to ${oauthSuccess}`,
      })
      setConnectedOAuthProviders(prev => [...prev, oauthSuccess])
      // Clean URL
      router.replace('/agents/new')
    }
    
    if (oauthError) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect: ${oauthError}`,
        variant: "destructive",
      })
      // Clean URL
      router.replace('/agents/new')
    }
  }, [router, toast])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <div className="py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1800px] mx-auto space-y-6">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-6 w-96 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect via useEffect
  }

  const handleCollectionToggle = (collectionId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collectionId) ? prev.filter((id) => id !== collectionId) : [...prev, collectionId]
    )
  }

  const addIntentMapping = () => {
    setIntentMappings((prev) => [...prev, { intent: "", keywords: "", collections: [] }])
  }

  const updateIntentMapping = (index: number, field: "intent" | "keywords" | "collections", value: string | string[]) => {
    setIntentMappings((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const removeIntentMapping = (index: number) => {
    setIntentMappings((prev) => prev.filter((_, i) => i !== index))
  }

  const handleToolToggle = (toolName: string) => {
    setSelectedTools((prev) => {
      const next = new Set(prev)
      if (next.has(toolName)) {
        next.delete(toolName)
      } else {
        next.add(toolName)
      }
      return next
    })
  }

  const handleWorkflowChange = (nodes: Node[], edges: Edge[]) => {
    setWorkflowNodes(nodes)
    setWorkflowEdges(edges)
  }

  // Auto-select basic tools when collections are selected
  useEffect(() => {
    const basicTools = new Set(["query_collection", "analyze_data", "get_collection_schema"])
    setSelectedTools((prev) => {
      const next = new Set(prev)
      basicTools.forEach(tool => next.add(tool))
      return next
    })
  }, [])

  // Load draft from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const draft = JSON.parse(saved)
          if (draft.name) setName(draft.name)
          if (draft.description) setDescription(draft.description)
          if (draft.selectedCollections?.length) setSelectedCollections(draft.selectedCollections)
          if (draft.intentMappings?.length) setIntentMappings(draft.intentMappings)
          if (draft.databaseConnection) setDatabaseConnection(draft.databaseConnection)
          if (draft.agenticConfig) setAgenticConfig(draft.agenticConfig)
          if (draft.selectedTools?.length) setSelectedTools(new Set(draft.selectedTools))
          if (draft.workflowNodes?.length) setWorkflowNodes(draft.workflowNodes)
          if (draft.workflowEdges?.length) setWorkflowEdges(draft.workflowEdges)
          if (draft.agentConfig) setAgentConfig(draft.agentConfig)
          if (draft.activeTab) setActiveTab(draft.activeTab)
          if (draft.lastSaved) setLastSaved(new Date(draft.lastSaved))
          
          toast({
            title: "Draft restored",
            description: "Your previous work has been restored.",
          })
        }
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }, [toast])

  // Auto-save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && (name || description || selectedCollections.length > 0)) {
      const saveTimeout = setTimeout(() => {
        try {
          const draft = {
            name,
            description,
            selectedCollections,
            intentMappings,
            databaseConnection,
            agenticConfig,
            selectedTools: Array.from(selectedTools),
            workflowNodes,
            workflowEdges,
            agentConfig,
            activeTab,
            lastSaved: new Date().toISOString(),
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
          setLastSaved(new Date())
        } catch (error) {
          console.error('Failed to save draft:', error)
        }
      }, 1000) // Debounce: save 1 second after last change

      return () => clearTimeout(saveTimeout)
    }
  }, [name, description, selectedCollections, intentMappings, databaseConnection, agenticConfig, selectedTools, workflowNodes, workflowEdges, agentConfig, activeTab])

  // Update agenticConfig based on selected tools
  useEffect(() => {
    if (selectedTools.size > 0) {
      const hasFinance = Array.from(selectedTools).some(t => t.includes("budget") || t.includes("cash") || t.includes("revenue") || t.includes("expense") || t.includes("financial"))
      const hasSales = Array.from(selectedTools).some(t => t.includes("pipeline") || t.includes("win") || t.includes("sales") || t.includes("deal") || t.includes("conversion"))
      const hasHR = Array.from(selectedTools).some(t => t.includes("team") || t.includes("performance") || t.includes("retention") || t.includes("hiring"))
      const hasCrossCollection = Array.from(selectedTools).some(t => t.includes("correlate") || t.includes("department"))
      const hasAdvanced = Array.from(selectedTools).some(t => t.includes("trend_") || t.includes("what_if") || t.includes("pattern_"))

      setAgenticConfig((prev) => ({
        ...prev,
        toolUse: {
          enableBasicTools: Array.from(selectedTools).some(t => ["query_collection", "analyze_data", "get_collection_schema"].includes(t)),
          enablePowerfulFinanceTools: hasFinance,
          enablePowerfulSalesTools: hasSales,
          enablePowerfulHRTools: hasHR,
          enablePowerfulCrossCollectionTools: hasCrossCollection,
          enablePowerfulAdvancedTools: hasAdvanced,
        },
      }))
    }
  }, [selectedTools])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (!name.trim() || selectedCollections.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide agent name and select at least one collection",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formattedMappings = intentMappings
        .filter((m) => m.intent && m.keywords)
        .map((m) => ({
          intent: m.intent.trim(),
          keywords: m.keywords.split(",").map((k) => k.trim()).filter(Boolean),
          collections: m.collections.length > 0 ? m.collections : selectedCollections,
        }))

      const finalMappings =
        formattedMappings.length > 0
          ? formattedMappings
          : [
              {
                intent: "general",
                keywords: ["all", "everything", "data"],
                collections: selectedCollections,
              },
            ]

      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          collections: selectedCollections,
          intentMappings: finalMappings,
          databaseConnection: databaseConnection || undefined,
          agenticConfig: agenticConfig || undefined,
          modelConfig: agentConfig.model || undefined,
          memoryConfig: agentConfig.memory || undefined,
          systemPrompt: agentConfig.systemPrompt || undefined,
          deploymentConfig: agentConfig.deployment || undefined,
          workflowConfig: workflowNodes.length > 0 || workflowEdges.length > 0 ? {
            nodes: workflowNodes,
            edges: workflowEdges,
          } : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to create agent" }))
        throw new Error(errorData.error || errorData.message || "Failed to create agent")
      }

      const agent = await response.json()
      
      // Clear draft on successful creation
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
      
      toast({
        title: "Success",
        description: "Agent created successfully",
      })
      router.push(`/agents/${agent.id}/chat`)
    } catch (error: any) {
      console.error("Error creating agent:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create agent. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <div className="py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-12 xl:px-16">
      <div className="max-w-[1800px] mx-auto">
          <Link
            href="/upload"
            className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <span className="font-medium">New:</span>
            <span>Upload Excel and chat. No setup.</span>
            <ArrowRight className="w-4 h-4 ml-auto flex-shrink-0" />
          </Link>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-light text-foreground mb-1">Create agent</h1>
            <p className="text-sm text-foreground/60">Name it and pick which data it can access.</p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Agent name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Finance Assistant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="What does this agent do?"
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data sources</CardTitle>
                  <CardDescription>Select collections this agent can query</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {AVAILABLE_COLLECTIONS.map((collection) => (
                      <label
                        key={collection.id}
                        className="flex items-center p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedCollections.includes(collection.id)}
                          onCheckedChange={() => handleCollectionToggle(collection.id)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-sm">{collection.label}</div>
                          <div className="text-xs text-foreground/50">{collection.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || selectedCollections.length === 0}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create agent"
                  )}
                </Button>
              </div>
            </form>

            <details className="group">
              <summary className="cursor-pointer list-none text-sm text-foreground/60 hover:text-foreground py-2">
                <span className="inline-flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                  Advanced (intent mappings, tools, workflow, model)
                </span>
              </summary>
              <div className="mt-4 pl-6 space-y-6 border-l border-border">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
                    <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
                    <TabsTrigger value="workflow" className="text-xs">Workflow</TabsTrigger>
                    <TabsTrigger value="config" className="text-xs">Config</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <DatabaseConnectionForm connection={databaseConnection} onConnectionChange={setDatabaseConnection} />
                    <AgenticConfigForm config={agenticConfig} onConfigChange={setAgenticConfig} selectedCollections={selectedCollections} />
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Intent mappings (optional)</CardTitle>
                        <CardDescription>Map keywords to collections</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button type="button" variant="outline" size="sm" onClick={addIntentMapping}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add intent
                        </Button>
                        {intentMappings.map((mapping, index) => (
                          <div key={index} className="p-3 border rounded-lg space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Intent {index + 1}</span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeIntentMapping(index)} className="text-destructive h-8 px-2">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <Input value={mapping.intent} onChange={(e) => updateIntentMapping(index, "intent", e.target.value)} placeholder="e.g. revenue" className="text-sm" />
                            <Input value={mapping.keywords} onChange={(e) => updateIntentMapping(index, "keywords", e.target.value)} placeholder="Keywords (comma-separated)" className="text-sm" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="tools" className="mt-4">
                    <OAuthConnections connectedProviders={connectedOAuthProviders} onProviderConnect={(id) => setConnectedOAuthProviders(prev => [...prev, id])} onProviderDisconnect={(id) => setConnectedOAuthProviders(prev => prev.filter(p => p !== id))} />
                    <ToolMarketplace selectedTools={selectedTools} onToolToggle={handleToolToggle} selectedCollections={selectedCollections} />
                  </TabsContent>
                  <TabsContent value="workflow" className="mt-4">
                    <VisualWorkflowBuilder selectedTools={selectedTools} onWorkflowChange={handleWorkflowChange} />
                  </TabsContent>
                  <TabsContent value="config" className="mt-4">
                    <AgentConfiguration config={agentConfig} onConfigChange={setAgentConfig} />
                  </TabsContent>
                </Tabs>
              </div>
            </details>
          </div>

          <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-6rem)]">
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Live Preview
                    </CardTitle>
                    <CardDescription>
                      Test your agent configuration in real-time
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <div className="h-full">
                  <AgentPreview
                    agentName={name || "Untitled Agent"}
                    agentDescription={description}
                    selectedCollections={selectedCollections}
                    selectedTools={selectedTools}
                    agenticConfig={agenticConfig}
                    databaseConnection={databaseConnection}
                    workflowNodes={workflowNodes}
                    workflowEdges={workflowEdges}
                    agentConfig={agentConfig}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
