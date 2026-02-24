"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, ArrowRight, FileSpreadsheet } from "lucide-react"
import { ChatMarkdown } from "@/components/chat-markdown"

const SUGGESTED_PROMPTS = [
  "What's our total spend?",
  "Top 5 expenses by category?",
  "What's our burn rate?",
]

export default function UploadPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [rowCount, setRowCount] = useState(0)
  const [fields, setFields] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; sources?: number[] }>>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploadError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || "Upload failed")
      setSessionId(data.sessionId)
      setRowCount(data.rowCount)
      setFields(data.fields || [])
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleSend = async (text?: string) => {
    const toSend = (text || input).trim()
    if (!toSend || isLoading || !sessionId) return

    setMessages((prev) => [...prev, { role: "user", content: toSend }])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: toSend }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || data.message || "Failed to get response")

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || "No response.",
          sources: data.sources?.rowIndices,
        },
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

  const endRef = (el: HTMLDivElement | null) => el?.scrollIntoView({ behavior: "smooth" })

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-foreground/80 hover:text-foreground">
            ← Back
          </Link>
          <Link href="/demo" className="text-sm text-foreground/60 hover:text-foreground">
            Or try sample data
          </Link>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-lg mx-auto">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Connect your data</h1>
          <p className="text-foreground/60 text-center mb-8">
            Upload Excel or CSV. Max 10MB, 10K rows. Your data stays in this session.
          </p>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              uploading ? "border-muted bg-muted/30" : "border-border hover:border-foreground/30 hover:bg-muted/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleSelect}
              className="hidden"
            />
            {uploading ? (
              <Loader2 className="w-12 h-12 mx-auto text-foreground/50 animate-spin mb-4" />
            ) : (
              <FileSpreadsheet className="w-12 h-12 mx-auto text-foreground/50 mb-4" />
            )}
            <p className="text-foreground/80 font-medium">
              {uploading ? "Parsing..." : "Drop your file here or click to browse"}
            </p>
            <p className="text-sm text-foreground/50 mt-1">CSV, .xlsx, .xls</p>
          </div>
          {uploadError && (
            <p className="mt-4 text-sm text-destructive">{uploadError}</p>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-foreground/80 hover:text-foreground">
          ← Back
        </Link>
        <div className="text-sm text-foreground/60">
          {rowCount.toLocaleString()} rows loaded
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
            <h1 className="text-2xl font-semibold text-foreground mb-2">Your data is ready</h1>
            <p className="text-foreground/60 mb-8 max-w-md">
              Ask a question about your {rowCount.toLocaleString()} rows. Columns: {fields.slice(0, 5).join(", ")}
              {fields.length > 5 ? ` +${fields.length - 5} more` : ""}.
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
                    <>
                      <ChatMarkdown content={m.content} className="text-sm leading-relaxed" />
                      {m.sources && m.sources.length > 0 && (
                        <p className="text-xs text-foreground/50 mt-2">
                          Based on rows {m.sources.slice(0, 10).join(", ")}
                          {m.sources.length > 10 ? ` (+${m.sources.length - 10} more)` : ""}
                        </p>
                      )}
                    </>
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
              placeholder="Ask about your data..."
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
