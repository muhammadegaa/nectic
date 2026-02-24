"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, ArrowRight, Sparkles } from "lucide-react"
import { ChatMarkdown } from "@/components/chat-markdown"

const SUGGESTED_PROMPTS = [
  "What's our total spend on software?",
  "What are our top 5 expenses by category?",
  "What's our burn rate this month?",
]

export default function DemoPage() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (text?: string) => {
    const toSend = (text || input).trim()
    if (!toSend || isLoading) return

    setMessages((prev) => [...prev, { role: "user", content: toSend }])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: toSend }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to get response")
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "No response." },
      ])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-foreground/80 hover:text-foreground">
          ← Back
        </Link>
        <div className="flex items-center gap-2 text-sm text-foreground/60">
          <Sparkles className="w-4 h-4" />
          Demo — Sample Finance Data
        </div>
        <Link href="/auth/signup">
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
            Connect your data
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Try Nectic
            </h1>
            <p className="text-foreground/60 mb-8 max-w-md">
              Ask questions about sample finance data. No signup required.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  className="text-left h-auto py-2 px-4 whitespace-normal max-w-xs"
                  onClick={() => handleSend(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    m.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <ChatMarkdown content={m.content} className="text-sm leading-relaxed" />
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about expenses, revenue, burn rate..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
