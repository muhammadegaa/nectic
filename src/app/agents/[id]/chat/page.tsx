"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import type { Agent } from "@/domain/entities/agent.entity"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  status?: "sending" | "sent" | "error"
}

export default function AgentChatPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const agentId = params.id as string
  const [agent, setAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAgent, setIsLoadingAgent] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAgent()
  }, [agentId])

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

      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm ${data.name}. ${data.description || "How can I help you today?"}`,
          timestamp: new Date().toISOString(),
        },
      ])
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          message: userMessage.content,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
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

  if (isLoadingAgent) {
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
            <div className="flex justify-start">
              <Card className="px-4 py-3 border-border max-w-3xl">
                <Skeleton className="h-4 w-56 mb-2" />
                <Skeleton className="h-4 w-72" />
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

  if (!agent) {
    return null
  }

  const exampleQuestions = [
    "What is our total revenue?",
    "Show me recent sales deals",
    "How many employees do we have?",
    "What are our top expenses?",
  ]

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 bg-card">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-foreground/60 hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-medium text-foreground">{agent.name}</h1>
              {agent.description && <p className="text-sm text-foreground/60 mt-1">{agent.description}</p>}
            </div>
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
                  {message.role === "user" && message.status && (
                    <span className="text-xs opacity-60">
                      {message.status === "sending" && "Sending..."}
                      {message.status === "sent" && "✓"}
                      {message.status === "error" && "✗"}
                    </span>
                  )}
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
      {messages.length === 1 && (
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
  )
}
