"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import LogoIcon from "@/components/logo-icon"
import { useAuth } from "@/contexts/auth-context"
import { getAccount, deleteAccount, updateAccount, type StoredAccount, type ParticipantRole, type ParticipantRoles } from "@/lib/concept-firestore"
import { parseWhatsAppFile, formatForPrompt, type WaParsed } from "@/lib/whatsapp-parser"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"

// ─── Config ──────────────────────────────────────────────────────────────────

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

const STARTER_PROMPTS = [
  "What should I say in the next CS call?",
  "Is renewal realistically at risk?",
  "What's the #1 thing the PM should fix this week?",
]

// ─── Markdown renderers ───────────────────────────────────────────────────────

const chatMarkdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-sm">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-neutral-400 pl-3 italic text-neutral-600 my-2">{children}</blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-neutral-200 text-neutral-800 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
  ),
  h1: ({ children }) => <h1 className="font-semibold text-base mb-1 mt-2">{children}</h1>,
  h2: ({ children }) => <h2 className="font-semibold text-sm mb-1 mt-2">{children}</h2>,
  h3: ({ children }) => <h3 className="font-semibold text-sm mb-1 mt-1">{children}</h3>,
}

const briefMarkdownComponents: Components = {
  p: ({ children }) => <p className="text-sm text-neutral-700 leading-relaxed mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-neutral-900">{children}</strong>,
  em: ({ children }) => <em className="italic text-neutral-600">{children}</em>,
  h1: ({ children }) => <h1 className="text-base font-bold text-neutral-900 mt-6 mb-2 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mt-5 mb-2 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-neutral-800 mt-4 mb-1">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-3 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-3 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-sm text-neutral-700 leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-neutral-300 pl-4 py-1 my-3 bg-neutral-50 rounded-r text-sm italic text-neutral-600">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-neutral-100 border border-neutral-200 text-neutral-700 rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>
  ),
  hr: () => <hr className="border-neutral-200 my-4" />,
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface ProductSignal {
  type: string
  title: string
  quote: string
  priority: string
  pmAction: string
}

function canGenerateBrief(signal: ProductSignal): boolean {
  return (signal.type === "complaint" || signal.type === "feature_request") && signal.priority !== "low"
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [account, setAccount] = useState<StoredAccount | null>(null)
  const [loadingAccount, setLoadingAccount] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [briefSignal, setBriefSignal] = useState<ProductSignal | null>(null)
  const [copied, setCopied] = useState(false)
  const [showReanalyze, setShowReanalyze] = useState(false)
  const [reanalyzeParsed, setReanalyzeParsed] = useState<WaParsed | null>(null)
  const [reanalyzeRoles, setReanalyzeRoles] = useState<ParticipantRoles>({})
  const [reanalyzeFile, setReanalyzeFile] = useState<File | null>(null)
  const [reanalyzeRunning, setReanalyzeRunning] = useState(false)
  const reanalyzeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/concept/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    getAccount(user.uid, id)
      .then(setAccount)
      .catch(console.error)
      .finally(() => setLoadingAccount(false))
  }, [user, id])

  const handleDelete = async () => {
    if (!user) return
    setDeleting(true)
    await deleteAccount(user.uid, id)
    router.push("/concept")
  }

  const copyShareLink = async () => {
    if (!account?.shareToken) return
    const url = `${window.location.origin}/concept/shared/${account.shareToken}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleReanalyzeFileSelect = async (file: File) => {
    if (!account) return
    try {
      const parsed = await parseWhatsAppFile(file)
      if (parsed.messages.length < 5) return
      const savedRoles = account.participantRoles ?? {}
      // Pre-fill from saved roles; mark any new participant as "other"
      const merged: ParticipantRoles = {}
      for (const name of parsed.participants) {
        merged[name] = savedRoles[name] ?? "other"
      }
      setReanalyzeFile(file)
      setReanalyzeParsed(parsed)
      setReanalyzeRoles(merged)
    } catch (err) {
      console.error("Parse failed:", err)
    }
  }

  const runReanalysis = async () => {
    if (!user || !account || !reanalyzeParsed || !reanalyzeFile) return
    setReanalyzeRunning(true)
    try {
      const conversation = formatForPrompt(reanalyzeParsed)
      const res = await fetch("/api/concept/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priorAnalysis: account.result,
          conversation,
          messageCount: reanalyzeParsed.totalMessages,
          participantRoles: reanalyzeRoles,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await updateAccount(user.uid, id, {
        result: data.result as AnalysisResult,
        fileName: reanalyzeFile.name,
        participantRoles: reanalyzeRoles,
        updatedAt: new Date().toISOString(),
      })
      const updated = await getAccount(user.uid, id)
      if (updated) setAccount(updated)
      setShowReanalyze(false)
      setReanalyzeParsed(null)
      setReanalyzeFile(null)
    } catch (err) {
      console.error("Re-analysis failed:", err)
    } finally {
      setReanalyzeRunning(false)
    }
  }

  if (authLoading || !user || loadingAccount) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-neutral-500">Account not found.</p>
          <Link href="/concept" className="mt-3 inline-block text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-[340px]">
      {/* Nav */}
      <nav className="bg-white border-b border-neutral-200 px-4 sm:px-6 h-12 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <LogoIcon size={20} />
            <span className="text-sm font-semibold text-neutral-900">Nectic</span>
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href="/concept" className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">Dashboard</Link>
          <span className="text-neutral-300">/</span>
          <span className="text-sm text-neutral-700 truncate max-w-32">{account.result.accountName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReanalyze(true)}
            className="text-xs text-neutral-500 border border-neutral-200 bg-white hover:bg-neutral-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            Update →
          </button>
          <button
            onClick={copyShareLink}
            className="text-xs text-neutral-500 border border-neutral-200 bg-white hover:bg-neutral-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            {copied ? "Link copied!" : "Share"}
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-neutral-400 hover:text-neutral-700 px-2 py-1 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50">
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-xs text-neutral-300 hover:text-red-500 transition-colors pl-1">Remove</button>
          )}
        </div>
      </nav>

      {/* Re-analysis file picker (hidden) */}
      <input
        ref={reanalyzeInputRef}
        type="file"
        accept=".txt,.zip,text/plain,application/zip"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReanalyzeFileSelect(f) }}
      />

      {/* Re-analysis modal */}
      {showReanalyze && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={reanalyzeRunning ? undefined : () => { setShowReanalyze(false); setReanalyzeParsed(null); setReanalyzeFile(null) }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              <div className="px-6 py-4 border-b border-neutral-100 flex-shrink-0">
                <p className="text-sm font-semibold text-neutral-900">Update account analysis</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {!reanalyzeParsed ? "Upload a newer export to compare against previous analysis" : `${reanalyzeParsed.totalMessages} messages parsed · confirm roles below`}
                </p>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-5">
                {!reanalyzeParsed ? (
                  <div>
                    <p className="text-xs text-neutral-500 mb-5 leading-relaxed">
                      Nectic will compare this against the previous analysis and surface what changed — new risks, resolved issues, health delta.
                    </p>
                    <button
                      onClick={() => reanalyzeInputRef.current?.click()}
                      className="w-full bg-neutral-900 text-white text-sm font-semibold py-3 rounded-lg hover:bg-neutral-700 transition-colors"
                    >
                      Choose file →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Show labelling only if there are new/unknown participants */}
                    {Object.values(reanalyzeRoles).some((r) => r === "other") ? (
                      <div>
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">Confirm roles</p>
                        <p className="text-xs text-neutral-500 mb-3">
                          Known participants are pre-filled from the saved account. Label any new ones.
                        </p>
                        <div className="space-y-2">
                          {Object.entries(reanalyzeRoles).map(([name, role]) => (
                            <div key={name} className="flex items-center gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                  role === "vendor" ? "bg-neutral-900 text-white" :
                                  role === "customer" ? "bg-blue-600 text-white" :
                                  role === "partner" ? "bg-purple-600 text-white" :
                                  "bg-neutral-100 text-neutral-400 border border-neutral-200"
                                }`}>
                                  {{ vendor: "My team", customer: "Customer", partner: "Partner", other: "?" }[role]}
                                </span>
                                <span className="text-xs text-neutral-700 truncate font-medium">{name}</span>
                              </div>
                              <select
                                value={role}
                                onChange={(e) => setReanalyzeRoles((prev) => ({ ...prev, [name]: e.target.value as ParticipantRole }))}
                                className="text-xs border border-neutral-200 rounded-lg px-2 py-1 text-neutral-700 bg-white focus:outline-none focus:border-neutral-400 flex-shrink-0"
                              >
                                <option value="other">Unknown</option>
                                <option value="vendor">My team</option>
                                <option value="customer">Customer</option>
                                <option value="partner">Partner / Reseller</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                        <p className="text-xs text-green-700 font-medium">All {Object.keys(reanalyzeRoles).length} participants recognised from previous analysis.</p>
                        <p className="text-xs text-green-600 mt-0.5">Roles pre-filled — ready to run.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {reanalyzeParsed && (
                <div className="px-6 py-4 border-t border-neutral-100 flex-shrink-0 space-y-2">
                  <button
                    onClick={runReanalysis}
                    disabled={reanalyzeRunning}
                    className="w-full bg-neutral-900 text-white text-sm font-semibold py-3 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50"
                  >
                    {reanalyzeRunning ? "Analysing…" : "Run update →"}
                  </button>
                  {!reanalyzeRunning && (
                    <button onClick={() => { setReanalyzeParsed(null); setReanalyzeFile(null) }} className="w-full text-xs text-neutral-400 hover:text-neutral-600 py-1 transition-colors">
                      Use a different file
                    </button>
                  )}
                </div>
              )}

              {!reanalyzeParsed && (
                <div className="px-6 py-3 border-t border-neutral-100 flex-shrink-0">
                  <button onClick={() => setShowReanalyze(false)} className="w-full text-xs text-neutral-400 hover:text-neutral-600 py-1 transition-colors">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Report */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <AnalysisReport
          result={account.result}
          fileName={account.fileName}
          analyzedAt={account.analyzedAt}
          onGenerateBrief={setBriefSignal}
        />
      </main>

      {/* Brief slide-over */}
      {briefSignal && (
        <BriefPanel
          signal={briefSignal}
          accountName={account.result.accountName}
          accountSummary={account.result.summary}
          onClose={() => setBriefSignal(null)}
        />
      )}

      {/* Chat panel — sticky bottom */}
      <ChatPanel analysis={account.result} />
    </div>
  )
}

// ─── Analysis report ──────────────────────────────────────────────────────────

function AnalysisReport({
  result,
  fileName,
  analyzedAt,
  onGenerateBrief,
}: {
  result: AnalysisResult
  fileName: string
  analyzedAt: string
  onGenerateBrief: (signal: ProductSignal) => void
}) {
  const risk = riskConfig[result.riskLevel] ?? riskConfig.medium
  const urgency = urgencyConfig[result.recommendedAction.urgency as keyof typeof urgencyConfig] ?? urgencyConfig.this_month
  const sentiment = {
    improving: { icon: "↗", text: "text-green-600", label: "Improving" },
    stable: { icon: "→", text: "text-neutral-500", label: "Stable" },
    declining: { icon: "↘", text: "text-red-500", label: "Declining" },
  }[result.sentimentTrend] ?? { icon: "→", text: "text-neutral-500", label: "Stable" }

  return (
    <div className="space-y-4">
      {/* Changes since last analysis */}
      {result.changesSince && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Updated analysis</p>
              <p className="text-sm text-blue-800 leading-relaxed">{result.changesSince.summary}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-blue-600">
                {result.changesSince.newRiskSignals > 0 && <span>+{result.changesSince.newRiskSignals} new risk signals</span>}
                {result.changesSince.resolvedSignals > 0 && <span>{result.changesSince.resolvedSignals} resolved</span>}
              </div>
            </div>
            <div className="flex-shrink-0 text-center">
              <p className={`text-2xl font-light ${result.changesSince.healthDelta > 0 ? "text-green-600" : result.changesSince.healthDelta < 0 ? "text-red-600" : "text-neutral-500"}`}>
                {result.changesSince.healthDelta > 0 ? `+${result.changesSince.healthDelta}` : result.changesSince.healthDelta}
              </p>
              <p className="text-xs text-neutral-400">health</p>
            </div>
          </div>
        </div>
      )}

      {/* Health score */}
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
        <div className="mt-5 flex items-center gap-4 flex-wrap pt-4 border-t border-black/5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`font-medium ${sentiment.text}`}>{sentiment.icon} {sentiment.label}</span>
            <span className="text-neutral-400">sentiment</span>
          </div>
          <span className="text-neutral-200">·</span>
          <span className="text-neutral-500">{result.stats?.messageCount} messages · {result.stats?.dateRange}</span>
          <span className="text-neutral-200">·</span>
          <div className="flex gap-1">
            {result.stats?.languages?.map((l) => (
              <span key={l} className="text-neutral-500 bg-white/60 border border-black/10 px-2 py-0.5 rounded-full">{l}</span>
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
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${urgency.color}`}>{urgency.label}</span>
            <span className="text-xs text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded">Owner: {result.recommendedAction.owner}</span>
          </div>
        </div>
      </div>

      {/* Risk signals */}
      {result.riskSignals?.length > 0 && (
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

      {/* Product signals — with Generate brief button */}
      {result.productSignals?.length > 0 && (
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 border rounded-full ${typeCfg.color}`}>{typeCfg.label}</span>
                      <p className="text-sm font-semibold text-neutral-800">{s.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold ${priColor}`}>{s.priority.charAt(0).toUpperCase() + s.priority.slice(1)}</span>
                      {canGenerateBrief(s) && (
                        <button
                          onClick={() => onGenerateBrief(s)}
                          className="text-xs text-neutral-500 border border-neutral-200 bg-white hover:bg-neutral-900 hover:text-white hover:border-neutral-900 px-2.5 py-1 rounded transition-colors font-medium"
                        >
                          Generate brief →
                        </button>
                      )}
                    </div>
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

      <div className="pt-2 pb-4">
        <Link href="/concept" className="inline-block border border-neutral-200 bg-white text-neutral-700 text-sm font-semibold px-5 py-2.5 rounded-lg hover:border-neutral-400 transition-colors">
          ← Back to dashboard
        </Link>
      </div>
      <p className="text-xs text-neutral-400 pb-4">
        Analyzed {new Date(analyzedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {fileName}
      </p>
    </div>
  )
}

// ─── Chat panel ───────────────────────────────────────────────────────────────

function ChatPanel({ analysis }: { analysis: AnalysisResult }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [open, setOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async (question: string) => {
    if (!question.trim() || streaming) return
    const q = question.trim()
    setInput("")
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: q }]
    setMessages(newMessages)
    setStreaming(true)

    // Append empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    try {
      const res = await fetch("/api/concept/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          messages: messages, // previous history (not including current question)
          question: q,
        }),
      })

      if (!res.ok || !res.body) throw new Error("Chat request failed")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const token = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === "assistant") {
            updated[updated.length - 1] = { ...last, content: last.content + token }
          }
          return updated
        })
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: "assistant", content: "Something went wrong. Please try again." }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col" style={{ maxHeight: open ? "340px" : "44px" }}>
      {/* Header bar */}
      <div
        className="bg-neutral-900 border-t border-neutral-700 px-4 h-11 flex items-center justify-between cursor-pointer flex-shrink-0"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs font-semibold text-white">Ask Nectic about this account</span>
          {streaming && <span className="text-xs text-neutral-400 animate-pulse">thinking…</span>}
        </div>
        <span className="text-neutral-400 text-xs">{open ? "▾" : "▴"}</span>
      </div>

      {open && (
        <div className="bg-white border-t border-neutral-200 flex flex-col flex-1 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="text-xs text-neutral-600 bg-neutral-100 border border-neutral-200 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "user" ? (
                    <div className="max-w-[80%] text-sm px-3 py-2 rounded-lg bg-neutral-900 text-white leading-relaxed">
                      {m.content}
                    </div>
                  ) : (
                    <div className="max-w-[80%] text-sm px-3 py-2 rounded-lg bg-neutral-100 text-neutral-800">
                      {m.content === "" && streaming && i === messages.length - 1 ? (
                        <span className="inline-block w-1.5 h-3.5 bg-neutral-400 animate-pulse ml-0.5 align-middle" />
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={chatMarkdownComponents}>
                          {m.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-neutral-100 px-3 py-2 flex items-end gap-2 flex-shrink-0">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this account…"
              disabled={streaming}
              className="flex-1 resize-none text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-transparent py-1 max-h-20 overflow-y-auto disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              className="flex-shrink-0 bg-neutral-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {streaming ? "…" : "↑"}
            </button>
          </div>
          <p className="px-3 pb-1.5 text-[10px] text-neutral-400">⌘ + Enter to send</p>
        </div>
      )}
    </div>
  )
}

// ─── Brief slide-over panel ───────────────────────────────────────────────────

function BriefPanel({
  signal,
  accountName,
  accountSummary,
  onClose,
}: {
  signal: ProductSignal
  accountName: string
  accountSummary: string
  onClose: () => void
}) {
  const [content, setContent] = useState("")
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    generate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generate = async () => {
    setGenerating(true)
    setContent("")
    setDone(false)

    try {
      const res = await fetch("/api/concept/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal, accountName, accountSummary }),
      })

      if (!res.ok || !res.body) throw new Error("Brief generation failed")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done: rdone, value } = await reader.read()
        if (rdone) break
        const token = decoder.decode(value, { stream: true })
        setContent((prev) => prev + token)
      }
      setDone(true)
    } catch {
      setContent("Brief generation failed. Please try again.")
      setDone(true)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white border-l border-neutral-200 z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 flex-shrink-0">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-0.5">Feature brief</p>
            <p className="text-sm font-semibold text-neutral-900 truncate max-w-[300px]">{signal.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {done && (
              <button
                onClick={copyToClipboard}
                className="text-xs text-neutral-600 border border-neutral-200 bg-white hover:bg-neutral-50 px-3 py-1.5 rounded transition-colors font-medium"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 transition-colors text-lg leading-none px-1">×</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!content && generating && (
            <div className="flex items-center gap-2 text-sm text-neutral-500 pt-4">
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin flex-shrink-0" />
              <span>Writing brief…</span>
            </div>
          )}
          {content && (
            <div className="pb-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={briefMarkdownComponents}>
                {content}
              </ReactMarkdown>
              {generating && <span className="inline-block w-1.5 h-4 bg-neutral-400 animate-pulse ml-0.5 align-middle" />}
            </div>
          )}
        </div>

        {/* Footer */}
        {done && (
          <div className="px-5 py-3 border-t border-neutral-100 flex-shrink-0">
            <button
              onClick={generate}
              className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Regenerate →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
