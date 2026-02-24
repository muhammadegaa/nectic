"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Check, Zap, TrendingUp, Users, Database, BarChart3, Sparkles, Info, ExternalLink, MessageSquare } from "lucide-react"
import { agentTools } from "@/lib/agent-tools"
import { financeTools, salesTools, hrTools, crossCollectionTools, advancedTools } from "@/lib/powerful-tools"
import { integrationTools, communicationTools, crmTools, storageTools, spreadsheetTools, paymentTools, projectManagementTools, marketingTools, dataWarehouseTools, apiTools } from "@/lib/integration-tools"
import type { ToolDefinition } from "@/lib/agent-tools"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface ToolMarketplaceProps {
  selectedTools: Set<string>
  onToolToggle: (toolName: string) => void
  selectedCollections: string[]
}

interface ToolCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  tools: ToolDefinition[]
  color: string
}

export function ToolMarketplace({ selectedTools, onToolToggle, selectedCollections }: ToolMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [previewTool, setPreviewTool] = useState<ToolDefinition | null>(null)

  const categories: ToolCategory[] = [
    {
      id: "basic",
      name: "Basic Tools",
      description: "Core data query and analysis tools",
      icon: <Database className="w-5 h-5" />,
      tools: agentTools,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20"
    },
    {
      id: "finance",
      name: "Finance Tools",
      description: "Budget analysis, forecasting, and financial insights",
      icon: <TrendingUp className="w-5 h-5" />,
      tools: financeTools,
      color: "bg-green-500/10 text-green-500 border-green-500/20"
    },
    {
      id: "sales",
      name: "Sales Tools",
      description: "Pipeline health, forecasting, and win rate analysis",
      icon: <Zap className="w-5 h-5" />,
      tools: salesTools,
      color: "bg-purple-500/10 text-purple-500 border-purple-500/20"
    },
    {
      id: "hr",
      name: "HR Tools",
      description: "Team capacity, performance, and retention analysis",
      icon: <Users className="w-5 h-5" />,
      tools: hrTools,
      color: "bg-orange-500/10 text-orange-500 border-orange-500/20"
    },
    {
      id: "cross-collection",
      name: "Cross-Collection",
      description: "Tools that work across multiple data sources",
      icon: <BarChart3 className="w-5 h-5" />,
      tools: crossCollectionTools,
      color: "bg-pink-500/10 text-pink-500 border-pink-500/20"
    },
    {
      id: "advanced",
      name: "Advanced Analysis",
      description: "Predictive analytics and pattern recognition",
      icon: <Sparkles className="w-5 h-5" />,
      tools: advancedTools,
      color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
    },
    {
      id: "communication",
      name: "Communication",
      description: "Slack, Email, Teams integration",
      icon: <MessageSquare className="w-5 h-5" />,
      tools: communicationTools,
      color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
    },
    {
      id: "crm",
      name: "CRM & Sales",
      description: "Salesforce, HubSpot, Pipedrive",
      icon: <Zap className="w-5 h-5" />,
      tools: crmTools,
      color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    },
    {
      id: "storage",
      name: "Cloud Storage",
      description: "S3, Google Drive, file management",
      icon: <Database className="w-5 h-5" />,
      tools: storageTools,
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    },
    {
      id: "spreadsheet",
      name: "Spreadsheets",
      description: "Google Sheets, Excel, CSV",
      icon: <BarChart3 className="w-5 h-5" />,
      tools: spreadsheetTools,
      color: "bg-teal-500/10 text-teal-500 border-teal-500/20"
    },
    {
      id: "payment",
      name: "Payments",
      description: "Stripe billing and subscriptions",
      icon: <TrendingUp className="w-5 h-5" />,
      tools: paymentTools,
      color: "bg-violet-500/10 text-violet-500 border-violet-500/20"
    },
    {
      id: "project",
      name: "Project Management",
      description: "Jira, Asana, Trello",
      icon: <Users className="w-5 h-5" />,
      tools: projectManagementTools,
      color: "bg-rose-500/10 text-rose-500 border-rose-500/20"
    },
    {
      id: "marketing",
      name: "Marketing & Analytics",
      description: "Google Analytics, Mailchimp",
      icon: <BarChart3 className="w-5 h-5" />,
      tools: marketingTools,
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20"
    },
    {
      id: "datawarehouse",
      name: "Data Warehouses",
      description: "Snowflake, BigQuery, Redshift",
      icon: <Database className="w-5 h-5" />,
      tools: dataWarehouseTools,
      color: "bg-sky-500/10 text-sky-500 border-sky-500/20"
    },
    {
      id: "api",
      name: "API & Webhooks",
      description: "REST API calls, webhook triggers",
      icon: <Zap className="w-5 h-5" />,
      tools: apiTools,
      color: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20"
    },
    {
      id: "communication",
      name: "Communication",
      description: "Slack, Email, Teams integration",
      icon: <MessageSquare className="w-5 h-5" />,
      tools: communicationTools,
      color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
    },
    {
      id: "crm",
      name: "CRM & Sales",
      description: "Salesforce, HubSpot, Pipedrive",
      icon: <Zap className="w-5 h-5" />,
      tools: crmTools,
      color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    },
    {
      id: "storage",
      name: "Cloud Storage",
      description: "S3, Google Drive, file management",
      icon: <Database className="w-5 h-5" />,
      tools: storageTools,
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    },
    {
      id: "spreadsheet",
      name: "Spreadsheets",
      description: "Google Sheets, Excel, CSV",
      icon: <BarChart3 className="w-5 h-5" />,
      tools: spreadsheetTools,
      color: "bg-teal-500/10 text-teal-500 border-teal-500/20"
    },
    {
      id: "payment",
      name: "Payments",
      description: "Stripe billing and subscriptions",
      icon: <TrendingUp className="w-5 h-5" />,
      tools: paymentTools,
      color: "bg-violet-500/10 text-violet-500 border-violet-500/20"
    },
    {
      id: "project",
      name: "Project Management",
      description: "Jira, Asana, Trello",
      icon: <Users className="w-5 h-5" />,
      tools: projectManagementTools,
      color: "bg-rose-500/10 text-rose-500 border-rose-500/20"
    },
    {
      id: "marketing",
      name: "Marketing & Analytics",
      description: "Google Analytics, Mailchimp",
      icon: <BarChart3 className="w-5 h-5" />,
      tools: marketingTools,
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20"
    },
    {
      id: "datawarehouse",
      name: "Data Warehouses",
      description: "Snowflake, BigQuery, Redshift",
      icon: <Database className="w-5 h-5" />,
      tools: dataWarehouseTools,
      color: "bg-sky-500/10 text-sky-500 border-sky-500/20"
    },
    {
      id: "api",
      name: "API & Webhooks",
      description: "REST API calls, webhook triggers",
      icon: <Zap className="w-5 h-5" />,
      tools: apiTools,
      color: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20"
    }
  ]

  const filteredCategories = categories.map(category => {
    const filteredTools = category.tools.filter(tool => {
      const matchesSearch = tool.function.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.function.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
    return { ...category, tools: filteredTools }
  }).filter(category => category.tools.length > 0)

  const getToolIcon = (toolName: string) => {
    if (toolName.includes("budget") || toolName.includes("cash") || toolName.includes("revenue") || toolName.includes("expense") || toolName.includes("financial")) {
      return <TrendingUp className="w-4 h-4" />
    }
    if (toolName.includes("pipeline") || toolName.includes("win") || toolName.includes("sales") || toolName.includes("deal") || toolName.includes("conversion")) {
      return <Zap className="w-4 h-4" />
    }
    if (toolName.includes("team") || toolName.includes("performance") || toolName.includes("retention") || toolName.includes("hiring")) {
      return <Users className="w-4 h-4" />
    }
    if (toolName.includes("query") || toolName.includes("schema")) {
      return <Database className="w-4 h-4" />
    }
    if (toolName.includes("analyze")) {
      return <BarChart3 className="w-4 h-4" />
    }
    return <Sparkles className="w-4 h-4" />
  }

  const isToolRelevant = (toolName: string, categoryId: string) => {
    if (categoryId === "basic") return true
    if (categoryId === "finance" && selectedCollections.some(c => c.includes("finance"))) return true
    if (categoryId === "sales" && selectedCollections.some(c => c.includes("sales"))) return true
    if (categoryId === "hr" && selectedCollections.some(c => c.includes("hr"))) return true
    if (categoryId === "cross-collection" && selectedCollections.length > 1) return true
    if (categoryId === "advanced") return true
    return false
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Tool Marketplace</h3>
          <p className="text-sm text-foreground/60 mt-1">
            Select tools your agent can use. Tools are automatically enabled based on your data collections.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {selectedTools.size} selected
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <Input
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All Tools
        </Button>
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="gap-2"
          >
            {category.icon}
            {category.name}
          </Button>
        ))}
      </div>

      <div className="space-y-6">
        {filteredCategories
          .filter(cat => selectedCategory === null || selectedCategory === cat.id)
          .map(category => {
            const relevantTools = category.tools.filter(tool => 
              isToolRelevant(tool.function.name, category.id)
            )

            if (relevantTools.length === 0) return null

            return (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader className={`${category.color} border-b`}>
                  <div className="flex items-center gap-3">
                    {category.icon}
                    <div>
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {relevantTools.map(tool => {
                      const toolName = tool.function.name
                      const isSelected = selectedTools.has(toolName)
                      const isRelevant = isToolRelevant(toolName, category.id)

                      return (
                        <div key={toolName} className="relative">
                          <div
                            className={`
                              relative p-4 border rounded-lg cursor-pointer transition-all duration-200
                              ${isSelected 
                                ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20" 
                                : "border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm"
                              }
                              ${!isRelevant ? "opacity-50 cursor-not-allowed" : ""}
                            `}
                            onClick={() => isRelevant && onToolToggle(toolName)}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                </div>
                              </div>
                            )}
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 ${isSelected ? "text-primary" : "text-foreground/40"}`}>
                                {getToolIcon(toolName)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium text-sm text-foreground">
                                    {toolName.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                  </h4>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setPreviewTool(tool)
                                        }}
                                      >
                                        <Info className="w-3 h-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                          {getToolIcon(toolName)}
                                          {toolName.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                        </DialogTitle>
                                        <DialogDescription>
                                          {tool.function.description}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 mt-4">
                                        <div>
                                          <h4 className="text-sm font-semibold mb-2">Parameters</h4>
                                          {tool.function.parameters?.properties ? (
                                            <div className="space-y-2">
                                              {Object.entries(tool.function.parameters.properties).map(([key, value]: [string, any]) => (
                                                <div key={key} className="p-3 bg-muted rounded-lg">
                                                  <div className="flex items-center justify-between mb-1">
                                                    <code className="text-sm font-mono text-primary">{key}</code>
                                                    {tool.function.parameters?.required?.includes(key) && (
                                                      <Badge variant="outline" className="text-xs">Required</Badge>
                                                    )}
                                                  </div>
                                                  <p className="text-xs text-foreground/60">{value.description || "No description"}</p>
                                                  {value.type && (
                                                    <Badge variant="secondary" className="mt-1 text-xs">
                                                      {value.type}
                                                      {value.enum && ` (${value.enum.join(", ")})`}
                                                    </Badge>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-sm text-foreground/60">No parameters required</p>
                                          )}
                                        </div>
                                        <Separator />
                                        <div>
                                          <h4 className="text-sm font-semibold mb-2">Category</h4>
                                          <Badge className={category.color}>{category.name}</Badge>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            variant={isSelected ? "default" : "outline"}
                                            onClick={() => {
                                              onToolToggle(toolName)
                                              setPreviewTool(null)
                                            }}
                                            className="flex-1"
                                          >
                                            {isSelected ? (
                                              <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Selected
                                              </>
                                            ) : (
                                              "Select Tool"
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                                <p className="text-xs text-foreground/60 line-clamp-2">
                                  {tool.function.description}
                                </p>
                                {!isRelevant && (
                                  <Badge variant="outline" className="mt-2 text-xs">
                                    Requires {category.name.toLowerCase()} data
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 text-foreground/60">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No tools found matching your search.</p>
        </div>
      )}
    </div>
  )
}

