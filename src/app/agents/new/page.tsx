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
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { DataPreview } from "@/components/agents/DataPreview"
import { DatabaseConnectionForm } from "@/components/agents/DatabaseConnection"
import type { DatabaseConnection } from "@/lib/db-adapters/base-adapter"

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Wait for auth to be ready before checking user
  // This prevents redirecting to login when auth is still restoring from persistence
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [authLoading, user, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-foreground/60" />
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
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to create agent" }))
        throw new Error(errorData.error || errorData.message || "Failed to create agent")
      }

      const agent = await response.json()
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
    <div className="min-h-screen bg-background py-12 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center text-foreground/60 hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <h1 className="text-4xl font-light text-foreground mb-8">Create New AI Agent</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Details</CardTitle>
              <CardDescription>Configure your AI agent's basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., Finance Assistant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What does this agent do?"
                />
              </div>
            </CardContent>
          </Card>

          <DatabaseConnectionForm
            connection={databaseConnection}
            onConnectionChange={setDatabaseConnection}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Collections</CardTitle>
                <CardDescription>Select the data sources this agent can access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {AVAILABLE_COLLECTIONS.map((collection) => (
                    <label
                      key={collection.id}
                      className="flex items-start p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedCollections.includes(collection.id)}
                        onCheckedChange={() => handleCollectionToggle(collection.id)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{collection.label}</div>
                        <div className="text-sm text-foreground/60 mt-1">{collection.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <DataPreview selectedCollections={selectedCollections} />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Intent Mappings</CardTitle>
                  <CardDescription>Map keywords to collections (optional)</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addIntentMapping}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Intent
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/60 mb-4">
                Map keywords to collections. If not specified, all selected collections will be used.
              </p>

              <div className="space-y-4">
                {intentMappings.map((mapping, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-foreground">Intent {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIntentMapping(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Intent Name</Label>
                        <Input
                          type="text"
                          value={mapping.intent}
                          onChange={(e) => updateIntentMapping(index, "intent", e.target.value)}
                          placeholder="e.g., revenue"
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Keywords (comma-separated)</Label>
                        <Input
                          type="text"
                          value={mapping.keywords}
                          onChange={(e) => updateIntentMapping(index, "keywords", e.target.value)}
                          placeholder="e.g., revenue, income, money, earnings"
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Collections (leave empty to use all selected)</Label>
                        <div className="space-y-2">
                          {selectedCollections.map((colId) => {
                            const col = AVAILABLE_COLLECTIONS.find((c) => c.id === colId)
                            return (
                              <label key={colId} className="flex items-center text-sm">
                                <Checkbox
                                  checked={mapping.collections.includes(colId)}
                                  onCheckedChange={(checked) => {
                                    const newCollections = checked
                                      ? [...mapping.collections, colId]
                                      : mapping.collections.filter((c) => c !== colId)
                                    updateIntentMapping(index, "collections", newCollections)
                                  }}
                                  className="mr-2"
                                />
                                <span className="text-foreground/80">{col?.label}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim() || selectedCollections.length === 0} className="bg-foreground text-background hover:bg-foreground/90">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Agent"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
