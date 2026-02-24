"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, Loader2, MessageSquare, Plus, Trash2, ThumbsUp, ThumbsDown, FileSearch, Download, MoreVertical, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format as formatDate, formatDistanceToNow } from "date-fns"
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
  // Default to showing sidebar on desktop, hidden on mobile
  const [showConversations, setShowConversations] = useState(true)
  const [votedMessages, setVotedMessages] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Note: generateOpportunityReport and exportConversation are defined but not currently used in UI
  // They may be used in future features or removed if not needed

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
    // Only load conversation if we have a conversationId and no messages loaded yet
    if (currentConversationId && messages.length === 0) {
      loadConversation(currentConversationId)
    } else if (!currentConversationId && agent && messages.length === 0) {
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

  const fetchAgent = async (retry = false) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`)
      if (!response.ok) throw new Error("Failed to fetch agent")
      const data = await response.json()
      setAgent(data)
    } catch (error) {
      console.error("Error fetching agent:", error)
      if (!retry) {
        toast({
          title: "Error",
          description: "Failed to load agent. Click to retry.",
          variant: "destructive",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAgent(true)}
            >
              Retry
            </Button>
          ),
        })
      } else {
      toast({
        title: "Error",
        description: "Failed to load agent",
        variant: "destructive",
      })
      router.push("/dashboard")
      }
    } finally {
      setIsLoadingAgent(false)
    }
  }

  const fetchConversations = async (retry = false) => {
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
      if (retry) {
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const loadConversation = async (convId: string) => {
    try {
      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/conversations/${convId}`, {
        headers,
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || "Failed to load conversation")
      }
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
    setInput("") // Clear input field
    // Clear messages to show welcome message
    if (agent) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm ${agent.name}. ${agent.description || "How can I help you today?"}`,
          timestamp: new Date().toISOString(),
        },
      ])
    } else {
      // If agent not loaded yet, show generic welcome
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hello! How can I help you today?",
          timestamp: new Date().toISOString(),
        },
      ])
    }
    router.replace(`/agents/${agentId}/chat`, { scroll: false })
    // Refresh conversations list to ensure all conversations are visible
    fetchConversations()
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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || "Failed to delete conversation")
      }
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

  const exportConversation = (format: 'json' | 'markdown') => {
    if (messages.length === 0) {
      toast({
        title: "No messages to export",
        description: "This conversation is empty.",
        variant: "destructive",
      })
      return
    }

    if (format === 'markdown') {
      const markdown = messages
        .filter(m => m.role !== 'thinking')
        .map(msg => {
          const role = msg.role === 'user' ? '**You**' : `**${agent?.name || 'Assistant'}**`
          const timestamp = formatDate(new Date(msg.timestamp), 'MMM d, yyyy h:mm a')
          return `${role} (${timestamp})\n\n${msg.content}\n\n---\n`
        })
        .join('\n')
      
      const blob = new Blob([markdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
      a.download = `conversation-${agent?.name || 'chat'}-${new Date().toISOString().split('T')[0]}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      
      toast({
        title: "Export successful",
        description: "Conversation exported as Markdown",
      })
      } else {
      const jsonData = {
        agent: agent?.name || 'Unknown',
        conversationId: currentConversationId,
        exportedAt: new Date().toISOString(),
        messages: messages.filter(m => m.role !== 'thinking').map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      }
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
      a.download = `conversation-${agent?.name || 'chat'}-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

      toast({
        title: "Export successful",
        description: "Conversation exported as JSON",
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
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || "Failed to get response. Please try again."
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Update conversation ID if this was a new conversation
      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId)
        router.replace(`/agents/${agentId}/chat?conversation=${data.conversationId}`, { scroll: false })
      }
      
      // Always refresh conversations list after sending a message
      // This ensures new conversations appear and existing ones are updated
      await fetchConversations()

      // Add reasoning steps as thinking messages
      if (data.reasoningSteps && data.reasoningSteps.length > 0) {
        const thinkingMessages: Message[] = data.reasoningSteps.map((step: any, index: number) => ({
          id: `thinking-${Date.now()}-${index}`,
          role: "thinking" as const,
          content: step.step,
          timestamp: new Date().toISOString(),
          toolCalls: step.tool ? [{
            tool: step.tool,
            args: step.args,
            result: step.result
          }] : undefined,
        }))
        
        setMessages((prev) => [...prev, ...thinkingMessages])
      }

      // Add final assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
        status: "sent",
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      console.error("Error sending message:", error)
      const errorMsg = error?.message || "Failed to send message. Please check your connection and try again."
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorMsg,
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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={`w-full sm:w-64 border-r border-border bg-card transition-all duration-300 fixed lg:static inset-0 lg:inset-auto z-40 ${
        showConversations ? "block" : "hidden"
      }`}>
        <div className="p-3 sm:p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm font-medium text-foreground">Conversations</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConversations(false)}
                className="h-8 w-8 p-0"
                title="Collapse sidebar"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewConversation}
                className="h-8 w-8 p-0"
                title="New conversation"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-73px)] sm:h-[calc(100vh-80px)]">
          {isLoadingConversations ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                <MessageSquare className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No conversations yet</p>
              <p className="text-xs text-muted-foreground mb-4">Start chatting with your agent to see conversations here</p>
              <Button
                variant="outline"
                size="sm"
                onClick={startNewConversation}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1.5" />
                New Conversation
              </Button>
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4 bg-card">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConversations(!showConversations)}
                className="h-9 w-9 p-0 flex-shrink-0"
                title={showConversations ? "Hide conversations" : "Show conversations"}
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
              <Link href="/dashboard" className="text-foreground/60 hover:text-foreground transition-colors flex-shrink-0">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link href="/" className="flex items-center gap-2 group transition-opacity duration-200 hover:opacity-80 flex-shrink-0">
                <img 
                  src="/logo-icon.svg" 
                  alt="Nectic" 
                  className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-200 group-hover:scale-105"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl font-medium text-foreground truncate">{agent.name}</h1>
                {agent.description && <p className="text-xs sm:text-sm text-foreground/60 mt-0.5 sm:mt-1 line-clamp-1">{agent.description}</p>}
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1">
              <Link href={`/agents/${agentId}/audit`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Audit Logs"
                >
                  <FileSearch className="w-4 h-4" />
                </Button>
              </Link>
              {currentConversationId && messages.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Export conversation"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => exportConversation('markdown')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export as Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportConversation('json')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            {currentConversationId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewConversation}
                className="h-8 w-8 p-0"
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
            {messages.map((message) => {
              // Handle thinking/reasoning messages differently
              if (message.role === "thinking") {
                return (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-[85%] sm:max-w-2xl md:max-w-3xl rounded-lg px-3 sm:px-4 py-2 sm:py-3 bg-muted/50 border border-border/50 text-foreground/70">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 mt-1.5 animate-pulse" />
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm leading-relaxed break-words italic">{message.content}</p>
                          {message.toolCalls && message.toolCalls.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/30">
                              {message.toolCalls.map((toolCall, idx) => (
                                <div key={idx} className="text-xs text-foreground/50">
                                  <span className="font-mono">{toolCall.tool}</span>
                                  {toolCall.result && (
                                    <span className="ml-2">
                                      → {Array.isArray(toolCall.result) 
                                        ? `${toolCall.result.length} results`
                                        : toolCall.result.count 
                                        ? `${toolCall.result.count} records`
                                        : 'done'}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
              
              return (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-2xl md:max-w-3xl rounded-lg px-3 sm:px-4 py-2 sm:py-3 ${
                      message.role === "user"
                        ? "bg-foreground text-background"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed break-words">{message.content}</p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <p className="text-xs opacity-60 flex-shrink-0">
                      {formatDate(new Date(message.timestamp), "h:mm a")}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
              )
            })}
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
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-border bg-card">
            <div className="max-w-4xl mx-auto">
              <p className="text-xs sm:text-sm font-medium text-foreground/60 mb-2 sm:mb-3">Try asking:</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {exampleQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(question)}
                    className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-card">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="text-sm sm:text-base h-10 sm:h-11 flex-1"
                disabled={isLoading}
                     aria-label="Message input"
                     aria-describedby="input-description"
              />
                   <span id="input-description" className="sr-only">
                     Type your message and press Enter to send
                   </span>
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
