"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { parseWhatsAppExport, formatForPrompt, type WaParsed } from "@/lib/whatsapp-parser"
import { getAccounts, saveAccount, deleteAccount, aggregateSignals, type StoredAccount } from "@/lib/concept-store"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"

type UploadStage = "idle" | "parsed" | "analyzing" | "error"

const riskConfig = {
  low: { label: "Low", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  medium: { label: "Medium", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  high: { label: "High", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  critical: { label: "Critical", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
}

const signalTypeConfig: Record<string, { label: string; color: string }> = {
  complaint: { label: "Complaint", color: "bg-red-50 text-red-700 border-red-200" },
  feature_request: { label: "Feature request", color: "bg-blue-50 text-blue-700 border-blue-200" },
  praise: { label: "Praise", color: "bg-green-50 text-green-700 border-green-200" },
  confusion: { label: "Confusion", color: "bg-amber-50 text-amber-700 border-amber-200" },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function ConceptPage() {
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle")
  const [parsed, setParsed] = useState<WaParsed | null>(null)
  const [fileName, setFileName] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [dragging, setDragging] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setAccounts(getAccounts())
    setHydrated(true)
  }, [])

  const refreshAccounts = () => setAccounts(getAccounts())

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
      setUploadError("Please upload a .txt file exported from WhatsApp.")
      setUploadStage("error")
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const raw = e.target?.result as string
      const p = parseWhatsAppExport(raw)
      if (p.messages.length < 5) {
        setUploadError("Couldn't parse this file. Make sure it's a WhatsApp chat export (.txt).")
        setUploadStage("error")
        return
      }
      setParsed(p)
      setUploadStage("parsed")
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
    setUploadStage("analyzing")
    setUploadError("")

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
      if (!res.ok) throw new Error(data.error || "Analysis failed")

      saveAccount({
        fileName,
        analyzedAt: new Date().toISOString(),
        result: data.result as AnalysisResult,
      })

      refreshAccounts()
      resetUpload()
      setShowUpload(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setUploadError(message)
      setUploadStage("error")
    }
  }

  const resetUpload = () => {
    setUploadStage("idle")
    setParsed(null)
    setFileName("")
    setUploadError("")
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleDelete = (id: string) => {
    deleteAccount(id)
    setDeletingId(null)
    refreshAccounts()
  }

  if (!hydrated) return null

  const aggregated = aggregateSignals(accounts)
  const atRisk = accounts.filter((a) => a.result.riskLevel === "high" || a.result.riskLevel === "critical").length
  const sharedSignals = aggregated.filter((s) => s.accountCount > 1).length

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Nav */}
      <nav className="bg-white border-b border-neutral-200 px-4 sm:px-6 h-12 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <LogoIcon size={20} />
          <span className="text-sm font-semibold text-neutral-900">Nectic</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full font-medium">
            Concept MVP
          </span>
          {accounts.length > 0 && (
            <button
              onClick={() => { setShowUpload(!showUpload); resetUpload() }}
              className="text-xs bg-neutral-900 text-white px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors font-medium"
            >
              + Add account
            </button>
          )}
        </div>
      </nav>

      {/* Inline upload panel */}
      {showUpload && (
        <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-6">
          <div className="max-w-2xl mx-auto">
            <UploadPanel
              stage={uploadStage}
              parsed={parsed}
              fileName={fileName}
              error={uploadError}
              dragging={dragging}
              inputRef={inputRef}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onFileSelect={() => inputRef.current?.click()}
              onInputChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              onAnalyze={analyze}
              onReset={resetUpload}
              onCancel={() => { setShowUpload(false); resetUpload() }}
            />
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Empty state */}
        {accounts.length === 0 && !showUpload && (
          <EmptyState onUpload={() => setShowUpload(true)} />
        )}

        {accounts.length === 0 && showUpload && null}

        {/* Dashboard */}
        {accounts.length > 0 && (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white border border-neutral-200 rounded-lg p-5">
                <p className="text-3xl font-light text-neutral-900">{accounts.length}</p>
                <p className="text-xs text-neutral-500 mt-1">accounts tracked</p>
              </div>
              <div className={`border rounded-lg p-5 ${atRisk > 0 ? "bg-red-50 border-red-200" : "bg-white border-neutral-200"}`}>
                <p className={`text-3xl font-light ${atRisk > 0 ? "text-red-600" : "text-neutral-900"}`}>{atRisk}</p>
                <p className={`text-xs mt-1 ${atRisk > 0 ? "text-red-500" : "text-neutral-500"}`}>at high / critical risk</p>
              </div>
              <div className={`border rounded-lg p-5 ${sharedSignals > 0 ? "bg-blue-50 border-blue-200" : "bg-white border-neutral-200"}`}>
                <p className={`text-3xl font-light ${sharedSignals > 0 ? "text-blue-600" : "text-neutral-900"}`}>{sharedSignals}</p>
                <p className={`text-xs mt-1 ${sharedSignals > 0 ? "text-blue-600" : "text-neutral-500"}`}>
                  {sharedSignals > 0 ? "signals across multiple accounts" : "shared signals (add more accounts)"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Accounts list — 3/5 */}
              <div className="lg:col-span-3 space-y-3">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Accounts</h2>
                {accounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onDelete={() => setDeletingId(account.id)}
                    confirmingDelete={deletingId === account.id}
                    onConfirmDelete={() => handleDelete(account.id)}
                    onCancelDelete={() => setDeletingId(null)}
                  />
                ))}
              </div>

              {/* Cross-account signals — 2/5 */}
              <div className="lg:col-span-2">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Product signals</h2>
                <CrossAccountSignals signals={aggregated} accountCount={accounts.length} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// ─── Account card ────────────────────────────────────────────────────────────

function AccountCard({
  account,
  onDelete,
  confirmingDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  account: StoredAccount
  onDelete: () => void
  confirmingDelete: boolean
  onConfirmDelete: () => void
  onCancelDelete: () => void
}) {
  const risk = riskConfig[account.result.riskLevel] ?? riskConfig.medium
  const topRisk = account.result.riskSignals?.[0]
  const topProduct = account.result.productSignals?.[0]

  return (
    <div className={`bg-white border rounded-lg overflow-hidden transition-shadow hover:shadow-sm ${confirmingDelete ? "border-red-300" : "border-neutral-200"}`}>
      <Link href={`/concept/account/${account.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${risk.bg} ${risk.text} ${risk.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                {risk.label} risk
              </span>
            </div>
            <p className="text-sm font-semibold text-neutral-900 truncate">{account.result.accountName}</p>
            {topRisk && (
              <p className="mt-1.5 text-xs text-neutral-500 line-clamp-1 italic">&ldquo;{topRisk.quote}&rdquo;</p>
            )}
            {!topRisk && topProduct && (
              <p className="mt-1.5 text-xs text-neutral-500 line-clamp-1">{topProduct.title}</p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <p className={`text-2xl font-light ${risk.text}`}>{account.result.healthScore}</p>
            <p className="text-xs text-neutral-400">/ 10</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-neutral-400 border-t border-neutral-100 pt-3">
          <span>{account.result.stats?.messageCount ?? "?"} messages</span>
          <span>·</span>
          <span>{account.result.riskSignals?.length ?? 0} risk signals</span>
          <span>·</span>
          <span>{timeAgo(account.analyzedAt)}</span>
        </div>
      </Link>

      {confirmingDelete ? (
        <div className="px-5 py-3 bg-red-50 border-t border-red-200 flex items-center justify-between gap-3">
          <p className="text-xs text-red-700">Remove this account?</p>
          <div className="flex gap-2">
            <button onClick={onCancelDelete} className="text-xs text-neutral-500 hover:text-neutral-700 px-2 py-1">Cancel</button>
            <button onClick={onConfirmDelete} className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors">Remove</button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-2 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-xs text-neutral-400">{account.fileName}</span>
          <button onClick={(e) => { e.preventDefault(); onDelete() }} className="text-xs text-neutral-300 hover:text-red-500 transition-colors">Remove</button>
        </div>
      )}
    </div>
  )
}

// ─── Cross-account signals ───────────────────────────────────────────────────

function CrossAccountSignals({ signals, accountCount }: { signals: ReturnType<typeof aggregateSignals>; accountCount: number }) {
  if (signals.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
        <p className="text-sm text-neutral-400">No product signals extracted yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {accountCount < 2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-xs text-blue-700 leading-relaxed">
            Add more accounts to see which product signals appear across your entire customer base.
          </p>
        </div>
      )}
      {signals.map((sig, i) => {
        const typeCfg = signalTypeConfig[sig.type] ?? signalTypeConfig.complaint
        const isShared = sig.accountCount > 1

        return (
          <div
            key={i}
            className={`bg-white border rounded-lg p-4 ${isShared ? "border-blue-200 bg-blue-50/30" : "border-neutral-200"}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-neutral-800 leading-snug">{sig.title}</p>
              {isShared && (
                <span className="flex-shrink-0 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
                  {sig.accountCount} accounts
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 border rounded-full ${typeCfg.color}`}>{typeCfg.label}</span>
              {sig.priority === "high" && <span className="text-xs text-red-600 font-medium">High priority</span>}
            </div>
            {isShared && sig.accountNames.length > 0 && (
              <p className="mt-2 text-xs text-neutral-500">{sig.accountNames.join(", ")}</p>
            )}
            <p className="mt-2 text-xs text-neutral-500 leading-relaxed">{sig.pmAction}</p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="max-w-lg mx-auto pt-16 text-center">
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">Account Intelligence</p>
      <h1 className="text-3xl font-light text-neutral-900 tracking-tight">
        What are your customers<br />
        <span className="text-neutral-400">actually telling you?</span>
      </h1>
      <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
        Upload WhatsApp group chat exports from your key accounts. Nectic surfaces churn signals, product pain points, and cross-account patterns your team would never catch manually.
      </p>
      <button
        onClick={onUpload}
        className="mt-8 bg-neutral-900 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-neutral-700 transition-colors"
      >
        Upload first account →
      </button>
      <p className="mt-4 text-xs text-neutral-400">
        Works with WhatsApp .txt exports · Bahasa Indonesia + English · Files never stored
      </p>
    </div>
  )
}

// ─── Upload panel ─────────────────────────────────────────────────────────────

function UploadPanel({
  stage,
  parsed,
  fileName,
  error,
  dragging,
  inputRef,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileSelect,
  onInputChange,
  onAnalyze,
  onReset,
  onCancel,
}: {
  stage: UploadStage
  parsed: WaParsed | null
  fileName: string
  error: string
  dragging: boolean
  inputRef: React.RefObject<HTMLInputElement>
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onFileSelect: () => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAnalyze: () => void
  onReset: () => void
  onCancel: () => void
}) {
  if (stage === "analyzing") {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          <span className="text-sm text-neutral-700">Analyzing {parsed?.totalMessages} messages…</span>
        </div>
        <p className="mt-2 text-xs text-neutral-400">~15 seconds · GPT-4o</p>
      </div>
    )
  }

  if (stage === "parsed" && parsed) {
    return (
      <div className="flex items-start gap-6">
        <div className="flex-1">
          <p className="text-sm font-semibold text-neutral-900 mb-1">{fileName}</p>
          <div className="flex gap-4 text-xs text-neutral-500">
            <span>{parsed.totalMessages} messages</span>
            <span>{parsed.participants.length} participants</span>
            <span>from {parsed.dateRange.from.split(" ")[0]}</span>
          </div>
          {parsed.truncated && (
            <p className="mt-2 text-xs text-amber-600">Large file — analyzing most recent {parsed.messages.length} messages.</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onReset} className="text-xs text-neutral-400 hover:text-neutral-700 px-3 py-2 transition-colors">Change</button>
          <button onClick={onAnalyze} className="text-xs bg-neutral-900 text-white font-semibold px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors">
            Analyze →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragging ? "border-neutral-400 bg-neutral-100" : "border-neutral-200 bg-neutral-50 hover:border-neutral-400"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onFileSelect}
      >
        <input ref={inputRef} type="file" accept=".txt,text/plain" className="hidden" onChange={onInputChange} />
        <p className="text-sm font-medium text-neutral-700">Drop WhatsApp export here</p>
        <p className="mt-1 text-xs text-neutral-400">or click to select · .txt file</p>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>
      <div className="mt-3 flex justify-end">
        <button onClick={onCancel} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">Cancel</button>
      </div>
    </div>
  )
}
