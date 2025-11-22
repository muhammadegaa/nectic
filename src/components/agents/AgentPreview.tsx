"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send, Play, MessageSquare, Bug, Workflow, Pause, PlayCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

interface AgentPreviewProps {
  agentName: string
  agentDescription?: string
  selectedCollections: string[]
  selectedTools: Set<string>
  agenticConfig?: any
  databaseConnection?: any
}

interface Message {
  role: "user" | "assistant" | "thinking"
  content: string
  toolCalls?: Array<{ name: string; args: any }>
  timestamp: Date
}

export function AgentPreview({
  agentName,
  agentDescription,
  selectedCollections,
  selectedTools,
  agenticConfig,
  databaseConnection,
}: AgentPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [executionSteps, setExecutionSteps] = useState<any[]>([])
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const { toast } = useToast()

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Create a temporary agent ID for preview
      const previewAgentId = "preview-agent"

      // Simulate execution steps for debug mode
      if (debugMode) {
        setExecutionSteps([
          { type: "input", name: "User Message", details: input },
          { type: "reasoning", name: "Analyzing Request", details: "Understanding user intent..." },
          { type: "planning", name: "Planning", details: "Determining required tools..." },
          { type: "execution", name: "Executing Tools", details: "Running queries..." },
          { type: "synthesis", name: "Synthesizing", details: "Combining results..." },
        ])
      }

      // For preview, show helpful message
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockResponse = `I understand you want to test: "${input}"

To fully test your agent, please:
1. Complete all required fields (Agent Name, Collections)
2. Create the agent
3. Test it in the chat interface

Your current configuration:
- Collections: ${selectedCollections.join(", ") || "None selected"}
- Tools: ${selectedTools.size} selected
- Model: ${agenticConfig?.model?.model || "Not configured"}

Once created, you can interact with your agent in real-time!`

      // Add assistant response
      const assistantMessage: Message = {
        role: "assistant",
        content: mockResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      
      if (debugMode) {
        setExecutionSteps(prev => [...prev, { type: "complete", name: "Response Generated", details: "Ready" }])
      }
    } catch (error: any) {
      console.error("Preview error:", error)
      toast({
        title: "Preview Error",
        description: error.message || "Failed to test agent. Make sure all required fields are filled.",
        variant: "destructive",
      })

      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${error.message || "Failed to get response. Please check your configuration."}`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Agent Preview & Test</CardTitle>
            <CardDescription className="text-xs mt-1">
              Test your agent before deploying. This uses your current configuration.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearChat}>
              Clear
            </Button>
            <Button 
              variant={debugMode ? "default" : "outline"} 
              size="sm" 
              onClick={() => setDebugMode(!debugMode)}
            >
              <Bug className="w-4 h-4 mr-2" />
              Debug
            </Button>
            <Button variant="outline" size="sm" onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Play className="w-4 h-4 mr-2" />
              Test
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Agent Info */}
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-foreground/60" />
              <span className="text-sm font-medium text-foreground">{agentName || "Unnamed Agent"}</span>
            </div>
            {agentDescription && (
              <p className="text-xs text-foreground/60">{agentDescription}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-foreground/60">
                {selectedCollections.length} collection{selectedCollections.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-foreground/60">•</span>
              <span className="text-xs text-foreground/60">
                {selectedTools.size} tool{selectedTools.size !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Debug Panel */}
          {debugMode && executionSteps.length > 0 && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Execution Debug
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {executionSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded border text-xs cursor-pointer ${
                        activeStep === idx ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setActiveStep(idx)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{step.type}</Badge>
                        <span className="font-medium">{step.name}</span>
                      </div>
                      {step.details && (
                        <p className="text-foreground/60 mt-1">{step.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat Messages */}
          <div className="h-[400px] overflow-y-auto border border-border rounded-lg p-4 bg-background space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-12 h-12 text-foreground/20 mb-4" />
                <p className="text-sm text-foreground/60">
                  Start a conversation to test your agent
                </p>
                <p className="text-xs text-foreground/40 mt-2">
                  Try asking: "What's our total revenue?" or "Show me the sales pipeline"
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.role === "thinking"
                        ? "bg-muted border border-border"
                        : "bg-muted/80"
                    }`}
                  >
                    {message.role === "thinking" && (
                      <div className="text-xs font-medium mb-2 text-foreground/60">
                        🤔 Thinking...
                      </div>
                    )}
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {message.toolCalls.map((toolCall, i) => (
                          <div key={i} className="text-xs bg-background/50 rounded px-2 py-1">
                            <span className="font-medium">🔧 {toolCall.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-foreground/60" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

