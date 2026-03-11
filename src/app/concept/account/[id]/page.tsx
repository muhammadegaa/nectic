"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { HealthSparkline } from "@/components/health-sparkline"
import { useAuth } from "@/contexts/auth-context"
import { getAccount, deleteAccount, updateAccount, prefillFromContactBook, mergeContactBook, saveSignalAction, signalKey, getWorkspace, type StoredAccount, type ParticipantRole, type ParticipantRoles, type SignalAction, type SignalActionStatus, type WorkspaceContext } from "@/lib/concept-firestore"
import { trackEvent } from "@/lib/posthog"
import { parseWhatsAppFile, formatForPrompt, type WaParsed } from "@/lib/whatsapp-parser"
import type { AnalysisResult, SuggestedAction } from "@/app/api/concept/analyze/route"

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductSignal {
  type: string
  title: string
  problemStatement?: string
  quote: string
  priority: string
  pmAction: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [account, setAccount] = useState<StoredAccount | null>(null)
  const [loadingAccount, setLoadingAccount] = useState(true)
  const [workspace, setWorkspace] = useState<WorkspaceContext>({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showReanalyze, setShowReanalyze] = useState(false)
  const [reanalyzeParsed, setReanalyzeParsed] = useState<WaParsed | null>(null)
  const [reanalyzeRoles, setReanalyzeRoles] = useState<ParticipantRoles>({})
  const [reanalyzeFile, setReanalyzeFile] = useState<File | null>(null)
  const [reanalyzeRunning, setReanalyzeRunning] = useState(false)
  const reanalyzeInputRef = useRef<HTMLInputElement>(null)
  const [accountSavedBanner, setAccountSavedBanner] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/concept/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    getAccount(user.uid, id)
      .then(setAccount)
      .catch(console.error)
      .finally(() => setLoadingAccount(false))
    getWorkspace(user.uid).then(setWorkspace).catch(() => {})
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
    if (!account || !user) return
    try {
      const parsed = await parseWhatsAppFile(file)
      if (parsed.messages.length < 5) return
      const savedRoles = account.participantRoles ?? {}
      // Pre-fill from account's saved roles, then fall back to contact book for any new names
      const contactBook = await prefillFromContactBook(user.uid, parsed.participants)
      const merged: ParticipantRoles = {}
      for (const name of parsed.participants) {
        merged[name] = savedRoles[name] ?? contactBook[name] ?? "other"
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
    trackEvent("reanalysis_triggered", { accountId: id, riskLevel: account.result.riskLevel })
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
          signalActions: account.signalActions ?? null,
          workspace,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await updateAccount(user.uid, id, {
        result: data.result as AnalysisResult,
        fileName: reanalyzeFile.name,
        participantRoles: reanalyzeRoles,
        updatedAt: new Date().toISOString(),
        workspaceVersion: workspace.version,
      })
      await mergeContactBook(user.uid, reanalyzeRoles)
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
    <div className="min-h-screen bg-neutral-50">
      {/* Nav */}
      <nav className="bg-white border-b border-neutral-200 px-4 sm:px-6 h-12 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/concept" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity flex-shrink-0">
            <LogoIcon size={18} />
          </Link>
          <span className="text-neutral-300 hidden sm:inline">/</span>
          <Link href="/concept" className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors hidden sm:inline">Dashboard</Link>
          <span className="text-neutral-300 hidden sm:inline">/</span>
          <span className="text-sm text-neutral-700 truncate max-w-[120px] sm:max-w-[200px]">{account.result.accountName}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Link
            href="/concept/workspace"
            className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors hidden sm:block"
            title="Workspace settings"
          >
            ⚙
          </Link>
          <button
            onClick={() => setShowReanalyze(true)}
            className="text-xs text-neutral-500 border border-neutral-200 bg-white hover:bg-neutral-50 px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            Update →
          </button>
          <button
            onClick={copyShareLink}
            className="hidden sm:block text-xs text-neutral-500 border border-neutral-200 bg-white hover:bg-neutral-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            {copied ? "Copied!" : "Share"}
          </button>
          {confirmDelete ? (
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-neutral-400 hover:text-neutral-700 px-2 py-1 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50">
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="hidden sm:block text-xs text-neutral-300 hover:text-red-500 transition-colors pl-1">Remove</button>
          )}
        </div>
      </nav>

      {/* Next best action — full-width strip below nav */}
      {account.result.recommendedAction && (() => {
        const rec = account.result.recommendedAction
        const suppressed = workspace.suppressedSignalTypes ?? []
        const visibleRiskSignals = (account.result.riskSignals ?? []).filter(
          (s) => !suppressed.includes((s as { type?: string }).type ?? "risk")
        )
        const allRiskDone = visibleRiskSignals.every((s) => {
          const t = (s as { type?: string }).type ?? "risk"
          const k = signalKey(t, (s as { title?: string }).title || (s.explanation ?? "").slice(0, 80))
          const a = account.signalActions?.[k]
          return a?.status === "done" || a?.status === "dismissed"
        })
        if (allRiskDone) return null
        const urgencyLabel = rec.urgency === "immediate" ? "Act now" : rec.urgency === "this_week" ? "This week" : "This month"
        const bg = rec.urgency === "immediate" ? "bg-red-900" : "bg-neutral-900"
        return (
          <div className={`${bg} px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4`}>
            <div className="min-w-0 flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 flex-shrink-0">{urgencyLabel} · {rec.owner}</span>
              <p className="text-xs font-medium text-white truncate">{rec.what}</p>
            </div>
            <Link href="/concept/board" className="text-xs text-neutral-400 hover:text-white transition-colors flex-shrink-0">
              Open inbox →
            </Link>
          </div>
        )
      })()}

      {/* Context drift warning — workspace was updated since this analysis */}
      {workspace.version !== undefined
        && account.workspaceVersion !== undefined
        && account.workspaceVersion < workspace.version
        && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-amber-500 text-xs flex-shrink-0">⚠</span>
            <p className="text-xs text-amber-700">
              Your workspace context was updated after this analysis — signals may not reflect your current product description.
            </p>
          </div>
          <button
            onClick={() => setShowReanalyze(true)}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex-shrink-0 transition-colors"
          >
            Re-analyze →
          </button>
        </div>
      )}

      {/* Low confidence warning — AI flagged this analysis as uncertain */}
      {account.result.analysisQuality?.confidence === "low" && (
        <div className="bg-neutral-100 border-b border-neutral-200 px-4 sm:px-6 py-2 flex items-center gap-2">
          <span className="text-neutral-400 text-xs flex-shrink-0">◌</span>
          <p className="text-xs text-neutral-500">
            Low confidence analysis — fewer than 20 messages or mostly vendor-side. Signals may not be representative.
            {account.result.analysisQuality.caveats?.length > 0 && (
              <span className="ml-1 italic">{account.result.analysisQuality.caveats[0]}</span>
            )}
          </p>
        </div>
      )}

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

      {/* Account saved banner */}
      {accountSavedBanner && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-600 text-white text-sm font-semibold px-5 py-3.5 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><polyline points="2 8 6 12 14 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Account saved — all risk signals resolved. ARR protected.
          <button onClick={() => setAccountSavedBanner(false)} className="ml-2 text-emerald-200 hover:text-white transition-colors text-base leading-none">×</button>
        </div>
      )}

      {/* Single-column report */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <AnalysisReport
          result={account.result}
          fileName={account.fileName}
          analyzedAt={account.analyzedAt}
          account={account}
          suppressedSignalTypes={workspace.suppressedSignalTypes}
          onSignalAction={async (key, action) => {
            if (!user) return
            try {
              await saveSignalAction(user.uid, account.id, key, action)
              const updatedActions = { ...account.signalActions, [key]: action }
              setAccount((prev) => prev ? { ...prev, signalActions: updatedActions } : prev)
              if (action.status === "done") {
                const riskKeys = (account.result.riskSignals ?? [])
                  .filter((s) => !(workspace.suppressedSignalTypes ?? []).includes((s as { type?: string }).type ?? "risk"))
                  .map((s) => {
                    const t = (s as { type?: string }).type ?? "risk"
                    return signalKey(t, (s as { title?: string }).title || s.explanation.slice(0, 80))
                  })
                const allDone = riskKeys.length > 0 && riskKeys.every((k) => {
                  const a = k === key ? action : updatedActions?.[k]
                  return a?.status === "done" || a?.status === "dismissed"
                })
                if (allDone) {
                  setAccountSavedBanner(true)
                  setTimeout(() => setAccountSavedBanner(false), 8000)
                }
              }
            } catch (err) {
              console.error("Failed to save signal action:", err)
            }
          }}
          onSaveContext={async (ctx) => {
            if (!user) return
            await updateAccount(user.uid, id, { supplementalContext: ctx })
            setAccount((prev) => prev ? { ...prev, supplementalContext: ctx } : prev)
          }}
          onReanalyzeWithContext={async (ctx) => {
            if (!user) return
            await updateAccount(user.uid, id, { supplementalContext: ctx })
            setAccount((prev) => prev ? { ...prev, supplementalContext: ctx } : prev)
            try {
              const res = await fetch("/api/concept/reanalyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  priorAnalysis: account.result,
                  participantRoles: account.participantRoles,
                  supplementalContext: ctx,
                  signalActions: account.signalActions ?? null,
                  workspace,
                }),
              })
              const data = await res.json()
              if (!res.ok) throw new Error(data.error)
              await updateAccount(user.uid, id, { result: data.result as AnalysisResult, updatedAt: new Date().toISOString() })
              const updated = await getAccount(user.uid, id)
              if (updated) setAccount(updated)
            } catch (err) {
              console.error("Context re-analysis failed:", err)
            }
          }}
        />
      </div>

    </div>
  )
}

// ─── Analysis report ──────────────────────────────────────────────────────────

function AnalysisReport({
  result,
  fileName,
  analyzedAt,
  account,
  suppressedSignalTypes,
  onSignalAction,
  onSaveContext,
  onReanalyzeWithContext,
}: {
  result: AnalysisResult
  fileName: string
  analyzedAt: string
  account: StoredAccount
  suppressedSignalTypes?: string[]
  onSignalAction: (key: string, action: SignalAction) => Promise<void>
  onSaveContext: (ctx: string) => Promise<void>
  onReanalyzeWithContext: (ctx: string) => Promise<void>
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

      {/* Analysis quality / caveats */}
      {result.analysisQuality && (result.analysisQuality.caveats.length > 0 || result.analysisQuality.dataGaps.length > 0) && (
        <AnalysisQualityBanner
          quality={result.analysisQuality}
          savedContext={account.supplementalContext}
          onSave={onSaveContext}
          onReanalyze={onReanalyzeWithContext}
        />
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
            {account.healthHistory && account.healthHistory.length >= 2 && (
              <div className="mt-3 flex flex-col items-center gap-1">
                <HealthSparkline history={account.healthHistory} width={80} height={28} />
                <p className="text-[10px] text-neutral-400">health trend</p>
              </div>
            )}
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

      {/* Competitor alert banner */}
      {result.competitorMentions?.length > 0 && (() => {
        const competitors = result.competitorMentions
        const competitorQuote = result.riskSignals?.find((s) =>
          competitors.some((c) => s.explanation?.toLowerCase().includes(c.toLowerCase()))
        )?.quote ?? result.riskSignals?.[0]?.quote
        const renewalMonth = account.context?.renewalMonth

        return (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-7 h-7 bg-orange-100 border border-orange-200 rounded-lg flex items-center justify-center shrink-0 text-orange-700 text-sm font-bold">⚡</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold text-orange-900">Competitor mentioned</p>
                  {competitors.map((c) => (
                    <span key={c} className="text-xs font-semibold bg-orange-200 text-orange-900 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
                {renewalMonth && (
                  <p className="text-xs text-orange-700 font-medium">Renewal: {renewalMonth} — act before the evaluation goes further</p>
                )}
              </div>
            </div>
            {competitorQuote && (
              <blockquote className="text-sm text-orange-900 italic border-l-4 border-orange-300 pl-3 py-1 bg-orange-100/60 rounded-r-lg mb-3 leading-relaxed">
                &ldquo;{competitorQuote}&rdquo;
              </blockquote>
            )}
          </div>
        )
      })()}

      {/* Risk signals */}
      {(() => {
        const suppressed = suppressedSignalTypes ?? []
        const visible = (result.riskSignals ?? []).filter((s) => !suppressed.includes((s as { type?: string }).type ?? "risk"))
        if (visible.length === 0) return null
        return (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-800">Risk signals</p>
            <span className="text-xs text-neutral-400">{visible.length} found</span>
          </div>
          <div className="divide-y divide-neutral-100">
            {visible.map((s, i) => {
              const sev = s.severity === "high" ? "border-l-red-400" : s.severity === "medium" ? "border-l-amber-400" : "border-l-neutral-300"
              const sType = (s as { type?: string }).type ?? "risk"
              const sTitle = (s as { title?: string }).title || s.explanation.slice(0, 80)
              const key = signalKey(sType, sTitle)
              return (
                <div key={i} className={`p-5 border-l-4 ${sev}`}>
                  <div className="bg-neutral-50 rounded px-3 py-2 text-sm text-neutral-600 italic border border-neutral-100 mb-2">
                    &ldquo;{s.quote}&rdquo;
                    {s.date && <span className="ml-2 text-xs text-neutral-400 not-italic">{s.date}</span>}
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed mb-3">{s.explanation}</p>
                  {(s as { suggestedActions?: SuggestedAction[] }).suggestedActions?.length ? (
                    <SuggestedActionsList actions={(s as { suggestedActions?: SuggestedAction[] }).suggestedActions!} />
                  ) : null}
                  <SignalActionControl
                    signalKey={key}
                    action={account.signalActions?.[key]}
                    onUpdate={onSignalAction}
                  />
                </div>
              )
            })}
          </div>
        </div>
        )
      })()}

      {/* Product signals — with Generate brief button */}
      {(() => {
        const suppressed = suppressedSignalTypes ?? []
        const visible = (result.productSignals ?? []).filter((s) => !suppressed.includes(s.type))
        if (visible.length === 0) return null
        return (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-800">Product signals</p>
            <span className="text-xs text-neutral-400">{visible.length} found</span>
          </div>
          <div className="divide-y divide-neutral-100">
            {visible.map((s, i) => {
              const typeCfg = signalTypeConfig[s.type] ?? signalTypeConfig.complaint
              const priColor = s.priority === "high" ? "text-red-600" : s.priority === "medium" ? "text-amber-600" : "text-neutral-400"
              const key = signalKey(s.type, s.title)
              return (
                <div key={i} className="p-4 sm:p-5">
                  <div className="mb-2">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 border rounded-full flex-shrink-0 ${typeCfg.color}`}>{typeCfg.label}</span>
                        <p className="text-sm font-semibold text-neutral-800">{s.title}</p>
                      </div>
                      <span className={`text-xs font-semibold flex-shrink-0 ${priColor}`}>{s.priority.charAt(0).toUpperCase() + s.priority.slice(1)}</span>
                    </div>
                  </div>
                  <div className="bg-neutral-50 rounded px-3 py-2 text-sm text-neutral-600 italic border border-neutral-100 mb-2">
                    &ldquo;{s.quote}&rdquo;
                  </div>
                  <p className="text-xs text-neutral-500 mb-3">
                    <span className="font-medium text-neutral-600">Suggested action:</span> {s.pmAction}
                  </p>
                  {s.suggestedActions?.length ? (
                    <SuggestedActionsList actions={s.suggestedActions} />
                  ) : null}
                  <SignalActionControl
                    signalKey={key}
                    action={account.signalActions?.[key]}
                    onUpdate={onSignalAction}
                  />
                </div>
              )
            })}
          </div>
        </div>
        )
      })()}

      {/* Relationship signals */}
      {result.relationshipSignals?.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100">
            <p className="text-sm font-semibold text-neutral-800">Relationship signals</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {result.relationshipSignals.map((s, i) => {
              const key = signalKey("relationship", s.observation)
              return (
                <div key={i} className="p-5">
                  <p className="text-sm font-medium text-neutral-700">{s.observation}</p>
                  <p className="mt-1 text-xs text-neutral-500 mb-3">{s.implication}</p>
                  <SignalActionControl
                    signalKey={key}
                    action={account.signalActions?.[key]}
                    onUpdate={onSignalAction}
                  />
                </div>
              )
            })}
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

// ─── Analysis quality banner ──────────────────────────────────────────────────

function AnalysisQualityBanner({
  quality,
  savedContext,
  onSave,
  onReanalyze,
}: {
  quality: NonNullable<AnalysisResult["analysisQuality"]>
  savedContext?: string
  onSave: (ctx: string) => Promise<void>
  onReanalyze: (ctx: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [context, setContext] = useState(savedContext ?? "")
  const [saving, setSaving] = useState(false)
  const [reanalysing, setReanalysing] = useState(false)
  const [saved, setSaved] = useState(false)

  const confColor = quality.confidence === "low"
    ? "bg-amber-50 border-amber-200"
    : quality.confidence === "medium"
    ? "bg-neutral-50 border-neutral-200"
    : "bg-green-50 border-green-200"
  const confText = quality.confidence === "low"
    ? "text-amber-700"
    : quality.confidence === "medium"
    ? "text-neutral-600"
    : "text-green-700"
  const confLabel = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" }[quality.confidence]

  const handleSave = async () => {
    if (!context.trim()) return
    setSaving(true)
    await onSave(context)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReanalyze = async () => {
    if (!context.trim()) return
    setReanalysing(true)
    await onReanalyze(context)
    setReanalysing(false)
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${confColor}`}>
      <button
        className="w-full px-5 py-3 flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${confText}`}>{confLabel}</span>
          {quality.confidence !== "high" && (
            <span className="text-xs text-neutral-500">· {quality.caveats.length + quality.dataGaps.length} thing{quality.caveats.length + quality.dataGaps.length !== 1 ? "s" : ""} to be aware of</span>
          )}
          {savedContext && (
            <span className="text-xs text-blue-500 font-medium">· you added context</span>
          )}
        </div>
        <span className="text-neutral-400 text-xs">{expanded ? "▾" : "▴"}</span>
      </button>
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-black/5 pt-3">
          {quality.caveats.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">What Nectic is uncertain about</p>
              <ul className="space-y-1">
                {quality.caveats.map((c, i) => (
                  <li key={i} className="text-xs text-neutral-600 flex gap-2">
                    <span className="text-amber-500 flex-shrink-0">⚠</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {quality.dataGaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">Missing context</p>
              <ul className="space-y-1">
                {quality.dataGaps.map((g, i) => (
                  <li key={i} className="text-xs text-neutral-600 flex gap-2">
                    <span className="text-blue-400 flex-shrink-0">→</span>{g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Supplemental context input */}
          <div className="pt-1 border-t border-black/5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Add what you know</p>
            <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
              Paste in any context that fills these gaps — contract values, stakeholder info, outcome of meetings, CRM notes, anything. Nectic will update the analysis without needing a new WhatsApp export.
            </p>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. BTN contract is 1.4M IDR, renewal in June. PKS approved April 2. Liana confirmed ITM is no longer a priority account..."
              rows={4}
              className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2.5 text-neutral-700 focus:outline-none focus:border-neutral-400 bg-white resize-none leading-relaxed"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                disabled={!context.trim() || saving}
                className="text-xs px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-colors"
              >
                {saved ? "Saved" : saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleReanalyze}
                disabled={!context.trim() || reanalysing}
                className="text-xs px-3 py-1.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 disabled:opacity-40 transition-colors"
              >
                {reanalysing ? "Updating analysis…" : "Update analysis"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Suggested actions list ───────────────────────────────────────────────────

const ownerColor: Record<string, string> = {
  CS: "bg-blue-50 text-blue-700",
  PM: "bg-purple-50 text-purple-700",
  Engineering: "bg-slate-50 text-slate-700",
  Sales: "bg-orange-50 text-orange-700",
}

const timelineLabel: Record<string, string> = {
  "24h": "24h",
  this_week: "this week",
  this_month: "this month",
}

function SuggestedActionsList({ actions }: { actions: SuggestedAction[] }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">Suggested next steps</p>
      <div className="space-y-1.5">
        {actions.map((a, i) => (
          <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-lg border border-neutral-100 bg-neutral-50 text-xs text-neutral-600">
            <span className="shrink-0 mt-0.5 text-neutral-300">→</span>
            <span className="flex-1 leading-snug">{a.step}</span>
            <div className="shrink-0 flex items-center gap-1.5 ml-2">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ownerColor[a.owner] ?? "bg-neutral-100 text-neutral-500"}`}>
                {a.owner}
              </span>
              <span className="text-[10px] text-neutral-400 whitespace-nowrap">{timelineLabel[a.timeline] ?? a.timeline}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Signal action control ────────────────────────────────────────────────────

const ACTION_OPTIONS: { value: SignalActionStatus; label: string; color: string }[] = [
  { value: "open", label: "Open", color: "bg-neutral-100 text-neutral-500 border-neutral-200" },
  { value: "in_progress", label: "In progress", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "done", label: "Done", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "dismissed", label: "Dismissed", color: "bg-neutral-50 text-neutral-400 border-neutral-200" },
]

function SignalActionControl({
  signalKey: key,
  action,
  onUpdate,
}: {
  signalKey: string
  action?: SignalAction
  onUpdate: (key: string, action: SignalAction) => Promise<void>
}) {
  const [status, setStatus] = useState<SignalActionStatus>(action?.status ?? "open")
  const [note, setNote] = useState(action?.note ?? "")
  const [expanded, setExpanded] = useState(!!action?.note)
  const [saving, setSaving] = useState(false)

  const current = ACTION_OPTIONS.find((o) => o.value === status)!

  const handleStatusChange = async (next: SignalActionStatus) => {
    setStatus(next)
    setSaving(true)
    trackEvent("signal_actioned", { status: next })
    try {
      await onUpdate(key, { status: next, note: note || undefined, updatedAt: new Date().toISOString() })
      if (next !== "open") setExpanded(true)
    } catch {
      setStatus(status)
    } finally {
      setSaving(false)
    }
  }

  const handleNoteSave = async () => {
    setSaving(true)
    try {
      await onUpdate(key, { status, note: note || undefined, updatedAt: new Date().toISOString() })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-1">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
          {ACTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all ${
                status === opt.value
                  ? `${opt.color} border shadow-sm`
                  : "text-neutral-400 hover:text-neutral-600 border border-transparent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {status !== "open" && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            {expanded ? "hide note" : action?.note ? "edit note" : "+ add note"}
          </button>
        )}
        {saving && <span className="text-xs text-neutral-300">saving…</span>}
      </div>
      {expanded && status !== "open" && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteSave}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNoteSave() } }}
            placeholder="What was decided or done…"
            className="flex-1 text-xs border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-700 focus:outline-none focus:border-neutral-400 bg-white"
          />
        </div>
      )}
    </div>
  )
}

