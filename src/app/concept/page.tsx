"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { parseWhatsAppExport, formatForPrompt, type WaParsed } from "@/lib/whatsapp-parser"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"

type Stage = "idle" | "parsed" | "analyzing" | "done" | "error"

const riskConfig = {
  low: { label: "Low risk", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", score: "text-green-600" },
  medium: { label: "Medium risk", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", score: "text-amber-600" },
  high: { label: "High risk", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", score: "text-orange-600" },
  critical: { label: "Critical", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", score: "text-red-600" },
}

const signalTypeConfig: Record<string, { label: string; color: string }> = {
  complaint: { label: "Complaint", color: "bg-red-50 text-red-700 border-red-200" },
  feature_request: { label: "Feature request", color: "bg-blue-50 text-blue-700 border-blue-200" },
  praise: { label: "Praise", color: "bg-green-50 text-green-700 border-green-200" },
  confusion: { label: "Confusion", color: "bg-amber-50 text-amber-700 border-amber-200" },
}

const urgencyConfig = {
  immediate: { label: "Act now", color: "text-red-600 bg-red-50 border-red-200" },
  this_week: { label: "This week", color: "text-amber-700 bg-amber-50 border-amber-200" },
  this_month: { label: "This month", color: "text-neutral-600 bg-neutral-100 border-neutral-200" },
}

export default function ConceptPage() {
  const [stage, setStage] = useState<Stage>("idle")
  const [parsed, setParsed] = useState<WaParsed | null>(null)
  const [fileName, setFileName] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState("")
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
      setError("Please upload a .txt file exported from WhatsApp.")
      setStage("error")
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const raw = e.target?.result as string
      const p = parseWhatsAppExport(raw)
      if (p.messages.length < 5) {
        setError("Couldn't parse this file. Make sure it's a WhatsApp chat export (.txt).")
        setStage("error")
        return
      }
      setParsed(p)
      setStage("parsed")
    }
    reader.readAsText(file, "utf-8")
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const analyze = async () => {
    if (!parsed) return
    setStage("analyzing")
    setError("")

    try {
      const conversation = formatForPrompt(parsed)
      const res = await fetch("/api/concept/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation,
          messageCount: parsed.totalMessages,
          participants: parsed.participants.length,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setResult(data.result)
      setStage("done")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setError(message)
      setStage("error")
    }
  }

  const reset = () => {
    setStage("idle")
    setParsed(null)
    setResult(null)
    setFileName("")
    setError("")
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Nav */}
      <nav className="bg-white border-b border-neutral-200 px-4 sm:px-6 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <LogoIcon size={20} />
          <span className="text-sm font-semibold text-neutral-900">Nectic</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full font-medium">
            Concept MVP
          </span>
          <Link href="/demo" className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors">
            See demo →
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        {stage === "idle" && (
          <div className="text-center mb-10">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">WhatsApp Signal Extractor</p>
            <h1 className="text-3xl font-light text-neutral-900 tracking-tight">
              What is your customer<br />
              <span className="text-neutral-400">actually telling you?</span>
            </h1>
            <p className="mt-4 text-base text-neutral-500 max-w-md mx-auto leading-relaxed">
              Upload a WhatsApp group chat export. Nectic reads it and surfaces churn signals,
              product pain points, and what your CS or PM team should do next.
            </p>
            <p className="mt-3 text-xs text-neutral-400">
              Works in Bahasa Indonesia, English, or mixed. Files are never stored.
            </p>
          </div>
        )}

        {/* Upload zone */}
        {(stage === "idle" || stage === "error") && (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
              dragging ? "border-neutral-400 bg-neutral-100" : "border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <div className="text-4xl mb-4">💬</div>
            <p className="text-sm font-medium text-neutral-700">
              Drop your WhatsApp export here
            </p>
            <p className="mt-1 text-xs text-neutral-400">or click to select a .txt file</p>

            <div className="mt-8 text-left max-w-xs mx-auto bg-neutral-50 rounded-lg p-4 border border-neutral-100">
              <p className="text-xs font-semibold text-neutral-500 mb-2">How to export from WhatsApp:</p>
              <ol className="space-y-1.5 text-xs text-neutral-500">
                <li className="flex gap-2"><span className="text-neutral-300 flex-shrink-0">1.</span>Open the group chat</li>
                <li className="flex gap-2"><span className="text-neutral-300 flex-shrink-0">2.</span>Tap ⋮ → More → Export chat</li>
                <li className="flex gap-2"><span className="text-neutral-300 flex-shrink-0">3.</span>Choose &quot;Without media&quot;</li>
                <li className="flex gap-2"><span className="text-neutral-300 flex-shrink-0">4.</span>Save as .txt and upload here</li>
              </ol>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-lg inline-block">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Parsed preview */}
        {stage === "parsed" && parsed && (
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Ready to analyze</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{fileName}</p>
                </div>
                <button onClick={reset} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
                  Change file
                </button>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                  <p className="text-2xl font-light text-neutral-900">{parsed.totalMessages}</p>
                  <p className="text-xs text-neutral-500 mt-1">messages found</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                  <p className="text-2xl font-light text-neutral-900">{parsed.participants.length}</p>
                  <p className="text-xs text-neutral-500 mt-1">participants</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                  <p className="text-lg font-light text-neutral-700 truncate">{parsed.dateRange.from.split(" ")[0]}</p>
                  <p className="text-xs text-neutral-500 mt-1">earliest message</p>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-xs font-medium text-neutral-400 mb-2 uppercase tracking-widest">Participants</p>
                <div className="flex flex-wrap gap-2">
                  {parsed.participants.slice(0, 10).map((p) => (
                    <span key={p} className="text-xs text-neutral-600 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-full">{p}</span>
                  ))}
                  {parsed.participants.length > 10 && (
                    <span className="text-xs text-neutral-400 px-2.5 py-1">+{parsed.participants.length - 10} more</span>
                  )}
                </div>
              </div>

              {parsed.truncated && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-4">
                  Large file — analyzing the most recent {parsed.messages.length} messages.
                </p>
              )}

              <button
                onClick={analyze}
                className="w-full bg-neutral-900 text-white text-sm font-semibold py-3 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                Analyze conversations →
              </button>
            </div>
          </div>
        )}

        {/* Analyzing */}
        {stage === "analyzing" && (
          <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
              <span className="text-sm font-medium text-neutral-700">Analyzing conversations…</span>
            </div>
            <p className="text-xs text-neutral-400">
              Reading {parsed?.totalMessages} messages · GPT-4o via OpenRouter · ~15 seconds
            </p>
          </div>
        )}

        {/* Results */}
        {stage === "done" && result && (
          <AnalysisReport result={result} onReset={reset} />
        )}
      </main>
    </div>
  )
}

function AnalysisReport({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const risk = riskConfig[result.riskLevel] ?? riskConfig.medium
  const urgency = urgencyConfig[result.recommendedAction.urgency as keyof typeof urgencyConfig] ?? urgencyConfig.this_month
  const sentiment = {
    improving: { icon: "↗", text: "text-green-600", label: "Improving" },
    stable: { icon: "→", text: "text-neutral-500", label: "Stable" },
    declining: { icon: "↘", text: "text-red-500", label: "Declining" },
  }[result.sentimentTrend] ?? { icon: "→", text: "text-neutral-500", label: "Stable" }

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className={`border rounded-lg p-6 ${risk.bg} ${risk.border}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1">Account analysis</p>
            <h2 className="text-xl font-semibold text-neutral-900">{result.accountName}</h2>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed max-w-lg">{result.summary}</p>
          </div>
          <div className="flex-shrink-0 text-center">
            <p className={`text-5xl font-light ${risk.score}`}>{result.healthScore}</p>
            <p className="text-xs text-neutral-500 mt-1">/ 10</p>
            <span className={`mt-2 inline-block text-xs font-semibold px-3 py-1 rounded-full border ${risk.bg} ${risk.text} ${risk.border}`}>
              {risk.label}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4 flex-wrap pt-4 border-t border-black/5">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-medium ${sentiment.text}`}>{sentiment.icon} {sentiment.label}</span>
            <span className="text-xs text-neutral-400">sentiment</span>
          </div>
          <span className="text-neutral-200">·</span>
          <div className="text-xs text-neutral-500">{result.stats.messageCount} messages · {result.stats.dateRange}</div>
          <span className="text-neutral-200">·</span>
          <div className="flex gap-1">
            {result.stats.languages.map((l) => (
              <span key={l} className="text-xs text-neutral-500 bg-white/60 border border-black/10 px-2 py-0.5 rounded-full">{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended action */}
      <div className="bg-neutral-900 rounded-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Recommended action</p>
            <p className="text-sm text-white leading-relaxed">{result.recommendedAction.what}</p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${urgency.color}`}>
              {urgency.label}
            </span>
            <span className="text-xs text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded">
              Owner: {result.recommendedAction.owner}
            </span>
          </div>
        </div>
      </div>

      {/* Risk signals */}
      {result.riskSignals.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-800">Risk signals</p>
            <span className="text-xs text-neutral-400">{result.riskSignals.length} found</span>
          </div>
          <div className="divide-y divide-neutral-100">
            {result.riskSignals.map((s, i) => {
              const sev = s.severity === "high" ? "border-l-red-400" : s.severity === "medium" ? "border-l-amber-400" : "border-l-neutral-300"
              return (
                <div key={i} className={`p-5 border-l-4 ${sev}`}>
                  <div className="bg-neutral-50 rounded px-3 py-2 text-sm text-neutral-600 italic border border-neutral-100 mb-2">
                    &ldquo;{s.quote}&rdquo;
                    {s.date && <span className="ml-2 text-xs text-neutral-400 not-italic">{s.date}</span>}
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">{s.explanation}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Product signals */}
      {result.productSignals.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-800">Product signals</p>
            <span className="text-xs text-neutral-400">{result.productSignals.length} found</span>
          </div>
          <div className="divide-y divide-neutral-100">
            {result.productSignals.map((s, i) => {
              const typeCfg = signalTypeConfig[s.type] ?? signalTypeConfig.complaint
              const priColor = s.priority === "high" ? "text-red-600" : s.priority === "medium" ? "text-amber-600" : "text-neutral-400"
              return (
                <div key={i} className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 border rounded-full ${typeCfg.color}`}>
                        {typeCfg.label}
                      </span>
                      <p className="text-sm font-semibold text-neutral-800">{s.title}</p>
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${priColor}`}>
                      {s.priority.charAt(0).toUpperCase() + s.priority.slice(1)} priority
                    </span>
                  </div>
                  <div className="bg-neutral-50 rounded px-3 py-2 text-sm text-neutral-600 italic border border-neutral-100 mb-2">
                    &ldquo;{s.quote}&rdquo;
                  </div>
                  <p className="text-xs text-neutral-500">
                    <span className="font-medium text-neutral-600">PM action:</span> {s.pmAction}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Relationship signals */}
      {result.relationshipSignals?.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100">
            <p className="text-sm font-semibold text-neutral-800">Relationship signals</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {result.relationshipSignals.map((s, i) => (
              <div key={i} className="p-5">
                <p className="text-sm font-medium text-neutral-700">{s.observation}</p>
                <p className="mt-1 text-xs text-neutral-500">{s.implication}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor mentions */}
      {result.competitorMentions?.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Competitors mentioned</p>
          <div className="flex gap-2 flex-wrap">
            {result.competitorMentions.map((c) => (
              <span key={c} className="text-sm font-medium text-neutral-700 bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-full">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onReset}
          className="flex-1 bg-neutral-900 text-white text-sm font-semibold py-3 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          Analyze another conversation
        </button>
        <Link
          href="/#early-access"
          className="flex-1 border border-neutral-200 bg-white text-neutral-700 text-sm font-semibold py-3 rounded-lg hover:border-neutral-400 transition-colors text-center"
        >
          Get early access →
        </Link>
      </div>

      <p className="text-xs text-neutral-400 text-center pb-4">
        Conversation data was processed in-memory and never stored. Analysis by GPT-4o via OpenRouter.
      </p>
    </div>
  )
}
