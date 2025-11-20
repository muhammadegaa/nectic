"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, Loader2, MessageSquare, Plus, Trash2, Download, ThumbsUp, ThumbsDown, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, formatDistanceToNow } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import type { Agent } from "@/domain/entities/agent.entity"
import type { Conversation, Message } from "@/domain/entities/conversation.entity"

export default function AgentChatPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const agentId = params.id as string
  const conversationIdFromUrl = searchParams.get('conversation')
  
  const [agent, setAgent] = useState<Agent | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationIdFromUrl)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAgent, setIsLoadingAgent] = useState(true)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [showConversations, setShowConversations] = useState(false)
  const [votedMessages, setVotedMessages] = useState<Set<string>>(new Set())
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
      return
    }
    if (user) {
      fetchAgent()
      fetchConversations()
    }
  }, [agentId, user, authLoading])

  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId)
    } else if (agent && messages.length === 0) {
      // Show welcome message only if no conversation loaded
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm ${agent.name}. ${agent.description || "How can I help you today?"}`,
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }, [currentConversationId, agent])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`)
      if (!response.ok) throw new Error("Failed to fetch agent")
      const data = await response.json()
      setAgent(data)
    } catch (error) {
      console.error("Error fetching agent:", error)
      toast({
        title: "Error",
        description: "Failed to load agent",
        variant: "destructive",
      })
      router.push("/dashboard")
    } finally {
      setIsLoadingAgent(false)
    }
  }

  const fetchConversations = async () => {
    if (!user) return
    try {
      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/conversations?agentId=${agentId}`, {
        headers,
      })
      if (!response.ok) throw new Error("Failed to fetch conversations")
      const data = await response.json()
      setConversations(data)
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const loadConversation = async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}`)
      if (!response.ok) throw new Error("Failed to load conversation")
      const data = await response.json()
      setMessages(data.messages)
      setCurrentConversationId(convId)
      // Update URL without reload
      router.replace(`/agents/${agentId}/chat?conversation=${convId}`, { scroll: false })
    } catch (error) {
      console.error("Error loading conversation:", error)
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      })
    }
  }

  const startNewConversation = () => {
    setCurrentConversationId(null)
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm ${agent?.name || "your assistant"}. ${agent?.description || "How can I help you today?"}`,
        timestamp: new Date().toISOString(),
      },
    ])
    router.replace(`/agents/${agentId}/chat`, { scroll: false })
  }

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this conversation?")) return
    
    try {
      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/conversations/${convId}`, {
        method: "DELETE",
        headers,
      })
      if (!response.ok) throw new Error("Failed to delete conversation")
      await fetchConversations()
      if (currentConversationId === convId) {
        startNewConversation()
      }
      toast({
        title: "Success",
        description: "Conversation deleted",
      })
    } catch (error) {
      console.error("Error deleting conversation:", error)
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      })
    }
  }

  const generateOpportunityReport = async () => {
    if (!user || !agent) {
      toast({
        title: "Error",
        description: "Unable to generate report",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingReport(true)
    try {
      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/agents/${agentId}/opportunity-report`, {
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

  const submitFeedback = async (messageId: string, feedback: 'up' | 'down') => {
    if (votedMessages.has(messageId) || !user || !currentConversationId) {
      return
    }

    try {
      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/agents/${agentId}/feedback`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: currentConversationId,
          messageId,
          feedback,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      // Mark message as voted
      setVotedMessages((prev) => new Set(prev).add(messageId))
      
      toast({
        title: "Feedback recorded",
        description: "Thank you for your feedback!",
      })
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    }
  }

  const exportConversation = async (format: 'json' | 'markdown') => {
    if (!currentConversationId || !user) {
      toast({
        title: "Error",
        description: "No conversation to export",
        variant: "destructive",
      })
      return
    }

    try {
      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const url = `/api/conversations/${currentConversationId}/export?format=${format}`
      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 403) {
          throw new Error("You don't have permission to export this conversation")
        } else if (response.status === 404) {
          throw new Error("Conversation not found")
        } else {
          throw new Error(errorData.message || "Failed to export conversation")
        }
      }

      if (format === 'json') {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `conversation-${currentConversationId}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        const text = await response.text()
        const blob = new Blob([text], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `conversation-${currentConversationId}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      toast({
        title: "Success",
        description: `Conversation exported as ${format.toUpperCase()}`,
      })
    } catch (error: any) {
      console.error("Error exporting conversation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to export conversation",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !user) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
      status: "sending",
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Update message status to sent
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === userMessage.id ? { ...msg, status: "sent" } : msg))
      )
    }, 100)

    try {
      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          message: userMessage.content,
          conversationId: currentConversationId || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      
      // Update conversation ID if this was a new conversation
      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId)
        router.replace(`/agents/${agentId}/chat?conversation=${data.conversationId}`, { scroll: false })
        await fetchConversations()
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
        status: "sent",
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isLoadingAgent) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="border-b border-border px-6 py-4 bg-card">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex justify-start">
              <Card className="px-4 py-3 border-border max-w-3xl">
                <Skeleton className="h-4 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </Card>
            </div>
          </div>
        </div>
        <div className="border-t border-border px-6 py-4 bg-card">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!agent || !user) {
    return null
  }

  const exampleQuestions = [
    "What is our total revenue?",
    "Show me recent sales deals",
    "How many employees do we have?",
    "What are our top expenses?",
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Conversations Sidebar */}
      <div className={`w-64 border-r border-border bg-card transition-all duration-300 ${
        showConversations ? "block" : "hidden lg:block"
      }`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-foreground">Conversations</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={startNewConversation}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-80px)]">
          {isLoadingConversations ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-foreground/60">
              No conversations yet. Start a new one!
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                    currentConversationId === conv.id
                      ? "bg-foreground/10 border border-foreground/20"
                      : "hover:bg-foreground/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                      <p className="text-xs text-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 bg-card">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConversations(!showConversations)}
                className="lg:hidden"
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
              <Link href="/dashboard" className="text-foreground/60 hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-medium text-foreground">{agent.name}</h1>
                {agent.description && <p className="text-sm text-foreground/60 mt-1">{agent.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateOpportunityReport}
                disabled={isGeneratingReport}
                className="text-sm"
              >
                {isGeneratingReport ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {isGeneratingReport ? "Generating..." : "AI Report"}
              </Button>
              {currentConversationId && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-sm"
                        disabled={!currentConversationId}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => exportConversation('json')}>
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportConversation('markdown')}>
                        Export as Markdown
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startNewConversation}
                    className="text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Chat
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-3xl rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs opacity-60">
                      {format(new Date(message.timestamp), "h:mm a")}
                    </p>
                    <div className="flex items-center gap-2">
                      {message.role === "user" && message.status && (
                        <span className="text-xs opacity-60">
                          {message.status === "sending" && "Sending..."}
                          {message.status === "sent" && "✓"}
                          {message.status === "error" && "✗"}
                        </span>
                      )}
                      {message.role === "assistant" && currentConversationId && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-70 hover:opacity-100 disabled:opacity-50"
                            onClick={() => submitFeedback(message.id, 'up')}
                            disabled={votedMessages.has(message.id)}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-70 hover:opacity-100 disabled:opacity-50"
                            onClick={() => submitFeedback(message.id, 'down')}
                            disabled={votedMessages.has(message.id)}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="px-4 py-3 border-border">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Example Questions */}
        {messages.length === 1 && !currentConversationId && (
          <div className="px-6 py-4 border-t border-border bg-card">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm font-medium text-foreground/60 mb-3">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {exampleQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(question)}
                    className="text-sm"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border px-6 py-4 bg-card">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} className="bg-foreground text-background hover:bg-foreground/90">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
