"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { useAuth } from "@/contexts/auth-context"
import { parseWhatsAppFile, formatForPrompt, type WaParsed } from "@/lib/whatsapp-parser"
import {
  getAccounts,
  saveAccount,
  deleteAccount,
  aggregateSignals,
  prefillFromContactBook,
  mergeContactBook,
  getWorkspace,
  saveWorkspace,
  type StoredAccount,
  type AccountContext,
  type ParticipantRole,
  type ParticipantRoles,
  type WorkspaceContext,
} from "@/lib/concept-firestore"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"
import { trackEvent, identifyUser } from "@/lib/posthog"

type ConnectStage = "method" | "instructions" | "upload" | "ready" | "analyzing" | "error" | "wa"

interface WaContact { id: string; wAid: string; name: string; phone: string; firstName?: string; lastName?: string; lastUpdated?: string }

const INDUSTRIES = ["SaaS / Software", "Fintech", "Logistics", "HR Tech", "E-commerce", "Healthcare", "Education", "Other"]
const CONTRACT_TIERS = [
  { value: "starter", label: "Starter  (<$500/mo)" },
  { value: "growth", label: "Growth  ($500–2k/mo)" },
  { value: "enterprise", label: "Enterprise  (>$2k/mo)" },
]

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

function WhatsAppIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConceptPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [workspace, setWorkspace] = useState<WorkspaceContext>({})
  const [showConnect, setShowConnect] = useState(false)
  const [connectStage, setConnectStage] = useState<ConnectStage>("instructions")
  const [parsed, setParsed] = useState<WaParsed | null>(null)
  const [fileName, setFileName] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [dragging, setDragging] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [participantRoles, setParticipantRoles] = useState<ParticipantRoles>({})
  const [aiSuggestedRoles, setAiSuggestedRoles] = useState<Set<string>>(new Set())
  const [classifying, setClassifying] = useState(false)
  const [context, setContext] = useState<AccountContext>({})
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/concept/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    identifyUser(user.uid, { email: user.email ?? undefined, name: user.displayName ?? undefined })
    setLoadingAccounts(true)
    getAccounts(user.uid)
      .then(setAccounts)
      .catch(console.error)
      .finally(() => setLoadingAccounts(false))
    getWorkspace(user.uid).then(setWorkspace).catch(() => {})
  }, [user])

  const refreshAccounts = async () => {
    if (!user) return
    const updated = await getAccounts(user.uid)
    setAccounts(updated)
  }

  const saveWaCredentials = async (endpoint: string, token: string) => {
    if (!user) return
    const updated = { ...workspace, watiEndpoint: endpoint, watiToken: token }
    await saveWorkspace(user.uid, updated)
    setWorkspace(updated)
  }

  const handleWaContactAnalyze = async (contact: WaContact) => {
    const contactName = contact.name || `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() || contact.wAid
    setConnectStage("analyzing")
    setFileName(`WA: ${contactName}`)
    try {
      const endpoint = workspace.watiEndpoint!
      const token = workspace.watiToken!
      const res = await fetch("/api/wati/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, token, phoneNumber: contact.wAid || contact.phone, contactName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to load messages")
      await analyzeFromWati(data.conversation, data.participantRoles, data.messageCount, contactName)
      closeConnect()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setUploadError(message)
      setConnectStage("error")
    }
  }

  const openConnect = () => {
    setConnectStage("method")
    setParsed(null)
    setFileName("")
    setUploadError("")
    setParticipantRoles({})
    setAiSuggestedRoles(new Set())
    setClassifying(false)
    setContext({})
    setShowConnect(true)
  }

  const closeConnect = () => {
    setShowConnect(false)
    setTimeout(() => {
      setConnectStage("instructions")
      setParsed(null)
      setFileName("")
      setUploadError("")
      setParticipantRoles({})
      setAiSuggestedRoles(new Set())
      setClassifying(false)
      setContext({})
      if (inputRef.current) inputRef.current.value = ""
    }, 200)
  }

  const handleFile = useCallback(async (file: File) => {
    const isValid = file.name.endsWith(".txt") || file.name.endsWith(".zip") ||
      file.type === "text/plain" || file.type === "application/zip" || file.type === "application/x-zip-compressed"
    if (!isValid) {
      setUploadError("Please upload a WhatsApp .txt export or .zip folder.")
      setConnectStage("error")
      return
    }
    setFileName(file.name)
    try {
      const p = await parseWhatsAppFile(file)
      if (p.messages.length < 5) {
        setUploadError("Couldn't parse this file. Make sure it's a WhatsApp chat export.")
        setConnectStage("error")
        return
      }
      setParsed(p)
      trackEvent("file_uploaded", { messageCount: p.messages.length, participants: p.participants.length })

      // Step 1: prefill known contacts from the contact book
      const prefilled = user
        ? await prefillFromContactBook(user.uid, p.participants)
        : p.participants.reduce<ParticipantRoles>((acc, n) => ({ ...acc, [n]: "other" }), {})

      setParticipantRoles(prefilled)
      setConnectStage("ready")

      // Step 2: auto-classify any participants still marked "other"
      const unknowns = p.participants.filter((name) => prefilled[name] === "other")
      if (unknowns.length > 0) {
        setClassifying(true)
        try {
          const samples = unknowns.map((name) => ({
            name,
            messages: p.messages
              .filter((m) => m.sender === name)
              .slice(0, 6)
              .map((m) => m.body),
          }))
          const res = await fetch("/api/concept/classify-participants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ participants: samples }),
          })
          if (res.ok) {
            const { roles } = await res.json() as { roles: ParticipantRoles }
            const suggested = new Set<string>()
            setParticipantRoles((prev) => {
              const next = { ...prev }
              for (const [name, role] of Object.entries(roles)) {
                if (role !== "other" && prev[name] === "other") {
                  next[name] = role
                  suggested.add(name)
                }
              }
              return next
            })
            setAiSuggestedRoles(suggested)
          }
        } catch {
          // best-effort, never block the flow
        } finally {
          setClassifying(false)
        }
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to read file.")
      setConnectStage("error")
    }
  }, [user])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const setRole = (name: string, role: ParticipantRole) => {
    setParticipantRoles((prev) => ({ ...prev, [name]: role }))
  }

  const analyze = async () => {
    if (!parsed || !user) return
    setConnectStage("analyzing")
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
          participantRoles,
          context,
          workspace,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Analysis failed")

      const shareToken = crypto.randomUUID()
      await saveAccount(user.uid, {
        fileName,
        analyzedAt: new Date().toISOString(),
        result: data.result as AnalysisResult,
        participantRoles,
        context,
        shareToken,
      })
      await mergeContactBook(user.uid, participantRoles)

      await refreshAccounts()
      trackEvent("analysis_completed", {
        riskLevel: (data.result as AnalysisResult).riskLevel,
        healthScore: (data.result as AnalysisResult).healthScore,
        messageCount: parsed.totalMessages,
      })
      closeConnect()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      trackEvent("analysis_failed", { error: message })
      setUploadError(message)
      setConnectStage("error")
    }
  }

  const analyzeFromWati = async (conversation: string, participantRoles: ParticipantRoles, messageCount: number, contactName: string) => {
    if (!user) return
    trackEvent("wati_import_attempted", { contactName })
    try {
      const res = await fetch("/api/concept/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation,
          messageCount,
          participantRoles,
          context: {},
          workspace,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Analysis failed")

      const shareToken = crypto.randomUUID()
      await saveAccount(user.uid, {
        fileName: `WATI: ${contactName}`,
        analyzedAt: new Date().toISOString(),
        result: data.result as AnalysisResult,
        participantRoles,
        context: {},
        shareToken,
      })
      await mergeContactBook(user.uid, participantRoles)
      await refreshAccounts()
      trackEvent("wati_import_completed", {
        riskLevel: (data.result as AnalysisResult).riskLevel,
        healthScore: (data.result as AnalysisResult).healthScore,
      })
    } catch (err) {
      throw err
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    await deleteAccount(user.uid, id)
    setDeletingId(null)
    await refreshAccounts()
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const sortedAccounts = [...accounts].sort((a, b) => (riskOrder[a.result.riskLevel] ?? 3) - (riskOrder[b.result.riskLevel] ?? 3))
  const aggregated = aggregateSignals(accounts)
  const atRisk = accounts.filter((a) => a.result.riskLevel === "high" || a.result.riskLevel === "critical").length
  const sharedPatterns = aggregated.filter((s) => s.accountCount > 1)
  const hasWorkspace = !!(workspace.productDescription || workspace.featureAreas || workspace.roadmapFocus || workspace.knownIssues)

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b border-neutral-200 px-4 sm:px-6 h-12 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <LogoIcon size={20} />
            <span className="text-sm font-semibold text-neutral-900">Nectic</span>
          </Link>
          <span className="text-neutral-200 hidden sm:inline">·</span>
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="text-neutral-900 font-semibold border-b-2 border-neutral-900 pb-0.5">Accounts</span>
            <Link href="/concept/board" className="text-neutral-400 hover:text-neutral-700 transition-colors">Signal board</Link>
            <Link href="/concept/workspace" className="text-neutral-400 hover:text-neutral-700 transition-colors">Workspace</Link>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full font-medium">Early access</span>
          {accounts.length > 0 && !loadingAccounts && (
            <button onClick={openConnect} className="flex items-center gap-1.5 text-xs bg-neutral-900 text-white px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors font-medium">
              <WhatsAppIcon size={12} />
              <span className="hidden sm:inline">Connect account</span>
              <span className="sm:hidden">Connect</span>
            </button>
          )}
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
            <span className="text-xs text-neutral-500 hidden sm:block">{user.displayName ?? user.email}</span>
            <button onClick={() => signOut()} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">Sign out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">
        {loadingAccounts ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {accounts.length === 0 && (
              <EmptyState onConnect={openConnect} userName={user.displayName?.split(" ")[0] ?? null} />
            )}
            {accounts.length > 0 && (
              <div className="space-y-6">
                {/* Stats row */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-lg px-3 py-2">
                    <span className="text-base font-semibold text-neutral-900 tabular-nums">{accounts.length}</span>
                    <span className="text-xs text-neutral-400">account{accounts.length !== 1 ? "s" : ""}</span>
                  </div>
                  {atRisk > 0 ? (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                      <span className="text-base font-semibold text-red-700 tabular-nums">{atRisk}</span>
                      <span className="text-xs text-red-600">need attention</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polyline points="2 8 6 12 14 4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span className="text-xs text-emerald-700 font-medium">All healthy</span>
                    </div>
                  )}
                  {sharedPatterns.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <span className="text-base font-semibold text-blue-700 tabular-nums">{sharedPatterns.length}</span>
                      <span className="text-xs text-blue-600">cross-account pattern{sharedPatterns.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>

                {/* Revenue at Risk — shown when accounts are at risk */}
                {atRisk > 0 && <RevenueAtRisk atRiskCount={atRisk} topAccountId={sortedAccounts[0]?.id} topAccountName={sortedAccounts[0]?.result.accountName} />}

                {/* Workspace setup nudge */}
                {!hasWorkspace && (
                  <Link href="/concept/workspace" className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 hover:bg-amber-100 transition-colors group">
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Set up your workspace to improve analysis quality</p>
                      <p className="text-xs text-amber-600 mt-0.5">Tell Nectic what your product does, your roadmap, and known issues. Takes 2 minutes.</p>
                    </div>
                    <span className="text-amber-600 text-sm group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                )}

                {/* Account list — sorted by risk */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Accounts</h2>
                    <span className="text-xs text-neutral-400">Sorted by risk</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sortedAccounts.map((account) => (
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
                </div>

                {/* Cross-account patterns — compact, max 3, link to board */}
                {aggregated.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                        {sharedPatterns.length > 0 ? "Patterns across accounts" : "Product signals"}
                      </h2>
                      <Link href="/concept/board" className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
                        All signals →
                      </Link>
                    </div>
                    {accounts.length < 2 && (
                      <p className="text-xs text-neutral-400 mb-3">Connect more accounts to see patterns that repeat across your customer base.</p>
                    )}
                    <div className="space-y-2">
                      {aggregated.slice(0, 4).map((sig, i) => {
                        const typeCfg = signalTypeConfig[sig.type] ?? signalTypeConfig.complaint
                        const isShared = sig.accountCount > 1
                        return (
                          <div key={i} className={`bg-white border rounded-lg px-4 py-3 flex items-start gap-3 ${isShared ? "border-blue-200" : "border-neutral-200"}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-xs font-medium px-2 py-0.5 border rounded-full flex-shrink-0 ${typeCfg.color}`}>{typeCfg.label}</span>
                                {isShared && <span className="text-xs font-semibold text-blue-600">{sig.accountCount} accounts</span>}
                                {sig.priority === "high" && !isShared && <span className="text-xs font-semibold text-red-500">High</span>}
                              </div>
                              <p className="text-xs font-semibold text-neutral-800 leading-snug">{sig.problemStatement || sig.title}</p>
                              {isShared && <p className="text-xs text-neutral-400 mt-0.5 truncate">{sig.accountNames.join(", ")}</p>}
                            </div>
                          </div>
                        )
                      })}
                      {aggregated.length > 4 && (
                        <Link href="/concept/board" className="block text-center text-xs text-neutral-400 hover:text-neutral-700 transition-colors py-2">
                          +{aggregated.length - 4} more on signal board →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-10 flex">
        <Link href="/concept" className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-neutral-900">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <span className="text-[10px] font-semibold">Accounts</span>
        </Link>
        <Link href="/concept/board" className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-neutral-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
          <span className="text-[10px] font-medium">Signals</span>
        </Link>
        <Link href="/concept/workspace" className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-neutral-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
          <span className="text-[10px] font-medium">Workspace</span>
        </Link>
      </nav>

      {showConnect && (
        <ConnectModal
          stage={connectStage}
          parsed={parsed}
          fileName={fileName}
          error={uploadError}
          dragging={dragging}
          inputRef={inputRef}
          participantRoles={participantRoles}
          aiSuggestedRoles={aiSuggestedRoles}
          classifying={classifying}
          context={context}
          workspace={workspace}
          onClose={closeConnect}
          onSelectMethodFile={() => setConnectStage("instructions")}
          onSelectMethodWa={() => setConnectStage("wa")}
          onContinueToUpload={() => setConnectStage("upload")}
          onBackToInstructions={() => setConnectStage("instructions")}
          onBackToMethod={() => setConnectStage("method")}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onFileSelect={() => inputRef.current?.click()}
          onInputChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          onSetRole={setRole}
          onContextChange={setContext}
          onAnalyze={analyze}
          onRetry={() => { setConnectStage("upload"); setUploadError(""); if (inputRef.current) inputRef.current.value = "" }}
          onSaveWaCredentials={saveWaCredentials}
          onWaContactAnalyze={handleWaContactAnalyze}
        />
      )}
    </div>
  )
}

// ─── Connect modal ─────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: ParticipantRole; label: string; color: string }[] = [
  { value: "other", label: "Unknown", color: "text-neutral-400" },
  { value: "vendor", label: "My team", color: "text-neutral-700" },
  { value: "customer", label: "Customer", color: "text-blue-700" },
  { value: "partner", label: "Partner / Reseller", color: "text-purple-700" },
]

const ROLE_BADGE: Record<ParticipantRole, string> = {
  vendor: "bg-neutral-900 text-white",
  customer: "bg-blue-600 text-white",
  partner: "bg-purple-600 text-white",
  other: "bg-neutral-100 text-neutral-400 border border-neutral-200",
}

const ROLE_LABEL: Record<ParticipantRole, string> = {
  vendor: "My team",
  customer: "Customer",
  partner: "Partner",
  other: "?",
}

function ConsentFooter({ onAnalyze, onRetry }: { onAnalyze: () => void; onRetry: () => void }) {
  const [agreed, setAgreed] = useState(false)
  return (
    <div className="px-6 py-4 border-t border-neutral-100 flex-shrink-0 space-y-3">
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
          />
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          I confirm I have the right to share these conversations for analysis.{" "}
          <a href="/privacy" target="_blank" className="underline hover:text-neutral-900 transition-colors">Privacy policy</a>
        </p>
      </label>
      <button
        onClick={onAnalyze}
        disabled={!agreed}
        className="w-full bg-neutral-900 text-white text-sm font-semibold py-3 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Run analysis →
      </button>
      <button onClick={onRetry} className="w-full text-xs text-neutral-400 hover:text-neutral-600 transition-colors py-1">
        Use a different file
      </button>
    </div>
  )
}

function ConnectModal({
  stage, parsed, fileName, error, dragging, inputRef,
  participantRoles, aiSuggestedRoles, classifying, context, workspace,
  onClose, onSelectMethodFile, onSelectMethodWa, onContinueToUpload, onBackToInstructions, onBackToMethod,
  onDrop, onDragOver, onDragLeave, onFileSelect, onInputChange,
  onSetRole, onContextChange, onAnalyze, onRetry,
  onSaveWaCredentials, onWaContactAnalyze,
}: {
  stage: ConnectStage
  parsed: WaParsed | null
  fileName: string
  error: string
  dragging: boolean
  inputRef: React.RefObject<HTMLInputElement>
  participantRoles: ParticipantRoles
  aiSuggestedRoles: Set<string>
  classifying: boolean
  context: AccountContext
  workspace: WorkspaceContext
  onClose: () => void
  onSelectMethodFile: () => void
  onSelectMethodWa: () => void
  onContinueToUpload: () => void
  onBackToInstructions: () => void
  onBackToMethod: () => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onFileSelect: () => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSetRole: (name: string, role: ParticipantRole) => void
  onContextChange: (ctx: AccountContext) => void
  onAnalyze: () => void
  onRetry: () => void
  onSaveWaCredentials: (endpoint: string, token: string) => Promise<void>
  onWaContactAnalyze: (contact: WaContact) => Promise<void>
}) {
  // WA subflow state (managed locally inside ConnectModal)
  const [waSubStage, setWaSubStage] = useState<"credentials" | "loading" | "contacts">(
    workspace.watiEndpoint && workspace.watiToken ? "loading" : "credentials"
  )
  const [waEndpoint, setWaEndpoint] = useState(workspace.watiEndpoint ?? "")
  const [waToken, setWaToken] = useState(workspace.watiToken ?? "")
  const [waTokenVisible, setWaTokenVisible] = useState(false)
  const [waContacts, setWaContacts] = useState<WaContact[]>([])
  const [waSearch, setWaSearch] = useState("")
  const [waConnecting, setWaConnecting] = useState(false)
  const [waError, setWaError] = useState("")

  // Sync credential fields when workspace loads async (race condition fix)
  useEffect(() => {
    if (workspace.watiEndpoint && !waEndpoint) setWaEndpoint(workspace.watiEndpoint)
    if (workspace.watiToken && !waToken) setWaToken(workspace.watiToken)
    // If credentials just became available, switch to loading substage
    if (workspace.watiEndpoint && workspace.watiToken && waSubStage === "credentials" && waContacts.length === 0 && !waError) {
      setWaSubStage("loading")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.watiEndpoint, workspace.watiToken])

  // Auto-load contacts when stage becomes "wa" and credentials exist
  useEffect(() => {
    if (stage !== "wa") return
    if (workspace.watiEndpoint && workspace.watiToken && waSubStage === "loading" && waContacts.length === 0 && !waError) {
      loadWaContacts(workspace.watiEndpoint, workspace.watiToken)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, waSubStage])

  const loadWaContacts = async (endpoint: string, token: string) => {
    setWaSubStage("loading")
    setWaError("")
    try {
      const res = await fetch("/api/wati/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, token, pageSize: 100 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to load contacts")
      setWaContacts(data.contacts ?? [])
      setWaSubStage("contacts")
    } catch (err) {
      setWaError(err instanceof Error ? err.message : "Connection failed")
      setWaSubStage("credentials")
    }
  }

  const handleWaConnect = async () => {
    if (!waEndpoint.trim() || !waToken.trim()) return
    setWaConnecting(true)
    try {
      await onSaveWaCredentials(waEndpoint.trim(), waToken.trim())
      await loadWaContacts(waEndpoint.trim(), waToken.trim())
    } finally {
      setWaConnecting(false)
    }
  }

  const waFiltered = waContacts.filter((c) => {
    const q = waSearch.toLowerCase()
    return (c.name ?? "").toLowerCase().includes(q) || (c.phone ?? "").includes(q) || (c.wAid ?? "").includes(q)
  })

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={stage === "analyzing" ? undefined : onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#25D366] rounded-lg flex items-center justify-center">
                <WhatsAppIcon size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Connect account</p>
                <p className="text-xs text-neutral-400">
                  {stage === "method" && "Choose how to connect"}
                  {stage === "instructions" && "Export a group chat to get started"}
                  {stage === "upload" && "Drop your export file"}
                  {stage === "ready" && "Review before analysis"}
                  {stage === "analyzing" && "Analysing…"}
                  {stage === "error" && "Something went wrong"}
                  {stage === "wa" && (waSubStage === "credentials" ? "Enter your API credentials" : waSubStage === "loading" ? "Connecting…" : "Select a contact")}
                </p>
              </div>
            </div>
            {stage !== "analyzing" && (
              <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 transition-colors text-xl leading-none">×</button>
            )}
          </div>

          {/* Body — scrollable */}
          <div className="overflow-y-auto flex-1 px-6 py-5">

            {stage === "method" && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">How do you want to connect?</p>
                <button
                  onClick={onSelectMethodWa}
                  className="w-full flex items-center gap-4 border border-neutral-200 rounded-xl p-4 hover:border-[#25D366] hover:bg-green-50/40 transition-all text-left group"
                >
                  <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center shrink-0">
                    <WhatsAppIcon size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-900">Connect WhatsApp</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Pull conversations directly — no manual export needed</p>
                  </div>
                  <svg className="text-neutral-300 group-hover:text-[#25D366] shrink-0 transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button
                  onClick={onSelectMethodFile}
                  className="w-full flex items-center gap-4 border border-neutral-200 rounded-xl p-4 hover:border-neutral-400 hover:bg-neutral-50 transition-all text-left group"
                >
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-500"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-900">Upload export</p>
                    <p className="text-xs text-neutral-400 mt-0.5">WhatsApp .txt or .zip chat export file</p>
                  </div>
                  <svg className="text-neutral-300 group-hover:text-neutral-600 shrink-0 transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            )}

            {stage === "wa" && (
              <div>
                {waSubStage === "credentials" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">WhatsApp Business</p>
                      <p className="text-xs text-neutral-500 leading-relaxed mb-1">
                        Connect your WhatsApp Business account to pull conversations directly.
                      </p>
                      <p className="text-xs text-neutral-400 mb-4">
                        Get your API endpoint and token from your{" "}
                        <a href="https://app.wati.io/settings/api" target="_blank" rel="noopener noreferrer" className="text-neutral-600 underline hover:text-neutral-900">
                          WATI dashboard → Settings → API
                        </a>.
                      </p>
                      {waError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{waError}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">API Endpoint</label>
                      <input
                        type="text"
                        value={waEndpoint}
                        onChange={(e) => setWaEndpoint(e.target.value)}
                        placeholder="https://live-mt-server.wati.io/12345"
                        className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Access Token</label>
                      <div className="relative">
                        <input
                          type={waTokenVisible ? "text" : "password"}
                          value={waToken}
                          onChange={(e) => setWaToken(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && waEndpoint.trim() && waToken.trim()) handleWaConnect() }}
                          placeholder="eyJhbGci…"
                          className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 pr-16 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-white"
                        />
                        <button type="button" onClick={() => setWaTokenVisible(!waTokenVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600">
                          {waTokenVisible ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleWaConnect}
                      disabled={!waEndpoint.trim() || !waToken.trim() || waConnecting}
                      className="w-full bg-neutral-900 text-white text-sm font-semibold py-3 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {waConnecting ? "Connecting…" : "Connect →"}
                    </button>
                    <button onClick={onBackToMethod} className="w-full text-xs text-neutral-400 hover:text-neutral-600 py-1 transition-colors">← Back</button>
                  </div>
                )}

                {waSubStage === "loading" && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-5 h-5 border-2 border-neutral-200 border-t-[#25D366] rounded-full animate-spin" />
                    <p className="text-sm text-neutral-500">Loading contacts…</p>
                  </div>
                )}

                {waSubStage === "contacts" && (
                  <div className="-mx-6">
                    <div className="px-4 pb-3 border-b border-neutral-100 space-y-2">
                      <input
                        type="text"
                        value={waSearch}
                        onChange={(e) => setWaSearch(e.target.value)}
                        placeholder="Search contacts…"
                        className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-400"
                        autoFocus
                      />
                    </div>
                    {waFiltered.length === 0 && (
                      <p className="text-center py-10 text-sm text-neutral-400">
                        {waSearch ? "No contacts match." : "No contacts found."}
                      </p>
                    )}
                    <div className="divide-y divide-neutral-100">
                      {waFiltered.map((contact) => {
                        const displayName = contact.name || `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() || contact.wAid
                        const lastActive = contact.lastUpdated
                          ? (() => {
                              const diff = Date.now() - new Date(contact.lastUpdated).getTime()
                              const d = Math.floor(diff / 86400000)
                              return d === 0 ? "today" : d === 1 ? "yesterday" : `${d}d ago`
                            })()
                          : null
                        return (
                          <button
                            key={contact.id}
                            onClick={() => onWaContactAnalyze(contact)}
                            className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-neutral-50 transition-colors text-left group"
                          >
                            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 group-hover:bg-neutral-200 transition-colors">
                              <span className="text-xs font-semibold text-neutral-600">{displayName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-900 truncate">{displayName}</p>
                              <p className="text-xs text-neutral-400 truncate">{contact.phone || contact.wAid}</p>
                            </div>
                            {lastActive && (
                              <span className="text-[11px] text-neutral-400 shrink-0">{lastActive}</span>
                            )}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300 shrink-0 group-hover:text-neutral-500 transition-colors"><path d="M9 18l6-6-6-6"/></svg>
                          </button>
                        )
                      })}
                    </div>
                    <div className="px-6 pt-3 pb-3 border-t border-neutral-100 flex items-center justify-between">
                      <p className="text-xs text-neutral-400">{waFiltered.length} contact{waFiltered.length !== 1 ? "s" : ""}</p>
                      <button
                        onClick={() => { setWaSubStage("credentials"); setWaContacts([]) }}
                        className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        Change credentials
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {stage === "instructions" && (
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">How to export</p>
                <div className="space-y-4">
                  <Step number={1} title="Open the WhatsApp group" description="The group chat between your team and the customer account." />
                  <Step number={2} title='Tap ⋮ → "More" → "Export chat"' description='iOS: tap the group name → "Export Chat". Android: tap ⋮ → "More" → "Export chat".' />
                  <Step number={3} title='"Without media" only' description="Select without media — text only. This keeps the file small." />
                  <Step number={4} title="Upload the file or ZIP" description="Save to Files and drop it here. Both .txt and .zip folder exports are accepted." />
                </div>
                <button onClick={onContinueToUpload} className="mt-6 w-full bg-neutral-900 text-white text-sm font-semibold py-3 rounded-lg hover:bg-neutral-700 transition-colors">
                  I have the file →
                </button>
                <p className="mt-3 text-center text-xs text-neutral-400">Files are processed in memory — never stored on our servers</p>
              </div>
            )}

            {stage === "upload" && (
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Upload export file</p>
                <div
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragging ? "border-[#25D366] bg-green-50" : "border-neutral-200 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100"}`}
                  onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={onFileSelect}
                >
                  <input ref={inputRef} type="file" accept=".txt,.zip,text/plain,application/zip" className="hidden" onChange={onInputChange} />
                  <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <WhatsAppIcon size={20} className="text-neutral-400" />
                  </div>
                  <p className="text-sm font-medium text-neutral-700">Drop your export here</p>
                  <p className="mt-1 text-xs text-neutral-400">.txt file or .zip folder — both accepted</p>
                </div>
                <button onClick={onBackToInstructions} className="mt-3 text-xs text-neutral-400 hover:text-neutral-600 transition-colors">← Back to instructions</button>
              </div>
            )}

            {stage === "ready" && parsed && (
              <div className="space-y-5">
                {/* Parsed stats */}
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">File parsed</p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-[#25D366] rounded flex items-center justify-center flex-shrink-0">
                        <WhatsAppIcon size={13} className="text-white" />
                      </div>
                      <p className="text-sm font-semibold text-neutral-900 truncate">{fileName}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white rounded-lg py-2 px-1 border border-green-100">
                        <p className="text-lg font-light text-neutral-900">{parsed.totalMessages}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">messages</p>
                      </div>
                      <div className="bg-white rounded-lg py-2 px-1 border border-green-100">
                        <p className="text-lg font-light text-neutral-900">{parsed.participants.length}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">participants</p>
                      </div>
                      <div className="bg-white rounded-lg py-2 px-1 border border-green-100">
                        <p className="text-xs font-medium text-neutral-900 mt-1">{parsed.dateRange.from.split(" ")[0]}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">from</p>
                      </div>
                    </div>
                    {parsed.truncated && (
                      <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
                        Large file — analysing the most recent {parsed.messages.length} messages.
                      </p>
                    )}
                  </div>
                </div>

                {/* Participant labelling */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Who&apos;s who</p>
                    {classifying && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 border border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                        <span className="text-xs text-neutral-400">Detecting roles…</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mb-3">
                    Roles are pre-filled from message patterns. Correct any that look off.
                  </p>
                  <div className="space-y-2">
                    {parsed.participants.map((name) => {
                      const role = participantRoles[name] ?? "other"
                      const isAiSuggested = aiSuggestedRoles.has(name)
                      return (
                        <div key={name} className="flex items-center gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_BADGE[role]}`}>
                              {ROLE_LABEL[role]}
                            </span>
                            <span className="text-xs text-neutral-700 truncate font-medium">{name}</span>
                          </div>
                          <select
                            value={role}
                            onChange={(e) => onSetRole(name, e.target.value as ParticipantRole)}
                            className="text-xs border border-neutral-200 rounded-lg px-2 py-1 text-neutral-700 bg-white focus:outline-none focus:border-neutral-400 flex-shrink-0"
                          >
                            {ROLE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    {Object.values(participantRoles).filter((r) => r === "other").length > 0
                      ? `${Object.values(participantRoles).filter((r) => r === "other").length} unlabelled — you can skip, but labelling improves accuracy.`
                      : "All participants labelled."}
                  </p>
                </div>

                {/* Account context */}
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">Account context <span className="normal-case font-normal text-neutral-400">(optional)</span></p>
                  <p className="text-xs text-neutral-500 mb-3">Helps Nectic score urgency and risk more accurately.</p>
                  <div className="space-y-2.5">
                    <select
                      value={context.industry ?? ""}
                      onChange={(e) => onContextChange({ ...context, industry: e.target.value || undefined })}
                      className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 focus:outline-none focus:border-neutral-400 bg-white"
                    >
                      <option value="">Industry (optional)</option>
                      {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <select
                      value={context.contractTier ?? ""}
                      onChange={(e) => onContextChange({ ...context, contractTier: e.target.value as AccountContext["contractTier"] || undefined })}
                      className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 focus:outline-none focus:border-neutral-400 bg-white"
                    >
                      <option value="">Contract tier (optional)</option>
                      {CONTRACT_TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <input
                      type="month"
                      value={context.renewalMonth ?? ""}
                      onChange={(e) => onContextChange({ ...context, renewalMonth: e.target.value || undefined })}
                      className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 focus:outline-none focus:border-neutral-400 bg-white"
                      placeholder="Renewal month (optional)"
                    />
                  </div>
                </div>
              </div>
            )}

            {stage === "analyzing" && (
              <div className="py-8 text-center">
                <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-semibold text-neutral-900">
                  {parsed ? `Analysing ${parsed.totalMessages} messages` : fileName ? `Analysing ${fileName.replace("WA: ", "")}…` : "Analysing conversation…"}
                </p>
                <p className="mt-1 text-xs text-neutral-400">Usually takes about 15–30 seconds</p>
                <div className="mt-5 space-y-2 text-left">
                  {["Identifying customer voice…", "Extracting risk signals…", "Grouping product signals…", "Scoring account health…"].map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-pulse" style={{ animationDelay: `${i * 350}ms` }} />
                      <p className="text-xs text-neutral-500">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stage === "error" && (
              <div className="py-4 text-center">
                <p className="text-sm font-semibold text-neutral-900 mb-2">Something went wrong</p>
                <p className="text-xs text-red-600 mb-5">{error}</p>
                <button onClick={onRetry} className="w-full bg-neutral-900 text-white text-sm font-semibold py-3 rounded-lg hover:bg-neutral-700 transition-colors">Try again</button>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          {stage === "ready" && (
            <ConsentFooter onAnalyze={onAnalyze} onRetry={onRetry} />
          )}
        </div>
      </div>
    </>
  )
}

// ─── Step component ────────────────────────────────────────────────────────────

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{number}</div>
      <div>
        <p className="text-sm font-semibold text-neutral-800">{title}</p>
        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ─── Account card ─────────────────────────────────────────────────────────────

function AccountCard({ account, onDelete, confirmingDelete, onConfirmDelete, onCancelDelete }: {
  account: StoredAccount; onDelete: () => void; confirmingDelete: boolean; onConfirmDelete: () => void; onCancelDelete: () => void
}) {
  const risk = riskConfig[account.result.riskLevel] ?? riskConfig.medium
  const topRisk = account.result.riskSignals?.[0]
  const topProduct = account.result.productSignals?.[0]
  const hasChanges = !!account.result.changesSince
  const isCritical = account.result.riskLevel === "critical"
  const isHigh = account.result.riskLevel === "high"
  const score = account.result.healthScore ?? 0
  const scoreBarColor = isCritical ? "bg-red-500" : isHigh ? "bg-orange-400" : account.result.riskLevel === "medium" ? "bg-amber-400" : "bg-emerald-500"

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${confirmingDelete ? "border-red-300" : "border-neutral-200"}`}>
      <Link href={`/concept/account/${account.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <div className="w-5 h-5 bg-[#25D366] rounded flex items-center justify-center flex-shrink-0">
                <WhatsAppIcon size={11} className="text-white" />
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${risk.bg} ${risk.text} ${risk.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${risk.dot} ${(isCritical || isHigh) ? "animate-pulse" : ""}`} />
                {risk.label}
              </span>
              {hasChanges && (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Updated</span>
              )}
            </div>
            <p className="text-sm font-semibold text-neutral-900 truncate">{account.result.accountName}</p>
            {topRisk && (
              <p className="mt-1.5 text-xs text-neutral-400 line-clamp-1 italic leading-relaxed">&ldquo;{topRisk.quote}&rdquo;</p>
            )}
            {!topRisk && topProduct && (
              <p className="mt-1.5 text-xs text-neutral-400 line-clamp-1">{topProduct.title}</p>
            )}
          </div>

          {/* Health score with mini bar */}
          <div className="flex-shrink-0 text-right">
            <p className={`text-2xl font-light tabular-nums ${risk.text}`}>{score}</p>
            <p className="text-[10px] text-neutral-400 mb-1.5">/ 10</p>
            <div className="w-10 h-1 bg-neutral-100 rounded-full overflow-hidden ml-auto">
              <div
                className={`h-full rounded-full ${scoreBarColor}`}
                style={{ width: `${(score / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-neutral-400 border-t border-neutral-100 pt-3 flex-wrap">
          <span>{account.result.stats?.messageCount ?? "?"} msg</span>
          <span className="text-neutral-200">·</span>
          <span>{account.result.riskSignals?.length ?? 0} risk signals</span>
          <span className="text-neutral-200">·</span>
          <span>{timeAgo(account.updatedAt ?? account.analyzedAt)}</span>
          {account.context?.industry && (
            <><span className="text-neutral-200">·</span><span className="capitalize">{account.context.industry}</span></>
          )}
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
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <WhatsAppIcon size={10} className="text-neutral-300" />
            <span className="truncate max-w-[160px]">{account.fileName}</span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); onDelete() }}
            className="text-xs text-neutral-300 hover:text-red-500 transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Cross-account signals ─────────────────────────────────────────────────────

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
          <p className="text-xs text-blue-700 leading-relaxed">Connect more accounts to see which problems appear across your customer base.</p>
        </div>
      )}
      {signals.map((sig, i) => {
        const typeCfg = signalTypeConfig[sig.type] ?? signalTypeConfig.complaint
        const isShared = sig.accountCount > 1
        return (
          <div key={i} className={`bg-white border rounded-lg p-4 ${isShared ? "border-blue-200 bg-blue-50/30" : "border-neutral-200"}`}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-xs font-semibold text-neutral-800 leading-snug">{sig.problemStatement || sig.title}</p>
              {isShared && (
                <span className="flex-shrink-0 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">{sig.accountCount} accounts</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs font-medium px-2 py-0.5 border rounded-full ${typeCfg.color}`}>{typeCfg.label}</span>
              {sig.priority === "high" && <span className="text-xs text-red-600 font-medium">High priority</span>}
            </div>
            {isShared && <p className="text-xs text-neutral-500 mb-1">{sig.accountNames.join(", ")}</p>}
            <p className="text-xs text-neutral-500 leading-relaxed">{sig.pmAction}</p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Revenue at Risk ──────────────────────────────────────────────────────────

const ACV_PRESETS = [
  { label: "$5k", value: 5000 },
  { label: "$10k", value: 10000 },
  { label: "$25k", value: 25000 },
  { label: "$50k", value: 50000 },
]

function RevenueAtRisk({ atRiskCount, topAccountId, topAccountName }: {
  atRiskCount: number
  topAccountId?: string
  topAccountName?: string
}) {
  const [acv, setAcv] = useState(10000)
  const [customAcv, setCustomAcv] = useState("")
  const [showCustom, setShowCustom] = useState(false)

  const effectiveAcv = showCustom ? (parseInt(customAcv.replace(/\D/g, "")) || 0) : acv
  const atRiskArr = atRiskCount * effectiveAcv
  const earlyRecovery = Math.round(atRiskArr * 0.40)
  const reactiveRecovery = Math.round(atRiskArr * 0.10)
  const opportunityCost = earlyRecovery - reactiveRecovery
  const earlyPct = Math.round((earlyRecovery / atRiskArr) * 100)
  const reactivePct = Math.round((reactiveRecovery / atRiskArr) * 100)

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 bg-neutral-900">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-sm font-semibold text-white">
            {atRiskCount} account{atRiskCount !== 1 ? "s" : ""} at risk
          </span>
          <span className="hidden sm:inline text-xs text-neutral-400">— revenue exposure below</span>
        </div>
        {topAccountId && (
          <Link
            href={`/concept/account/${topAccountId}`}
            className="text-xs text-neutral-300 hover:text-white transition-colors font-medium flex items-center gap-1"
          >
            Act on {topAccountName ?? "top risk"}
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        )}
      </div>

      <div className="px-5 py-4">
        {/* ACV selector */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-neutral-500 font-medium mr-1">ACV:</span>
          {ACV_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => { setAcv(p.value); setShowCustom(false) }}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all duration-100 ${
                !showCustom && acv === p.value
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setShowCustom(true)}
            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all duration-100 ${
              showCustom
                ? "bg-neutral-900 text-white border-neutral-900"
                : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
            }`}
          >
            Custom
          </button>
          {showCustom && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-neutral-400">$</span>
              <input
                autoFocus
                type="text"
                value={customAcv}
                onChange={(e) => setCustomAcv(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter ACV"
                className="w-24 text-xs border border-neutral-300 rounded-lg px-2 py-1 focus:outline-none focus:border-neutral-500 text-neutral-700"
              />
              <span className="text-xs text-neutral-400">/yr</span>
            </div>
          )}
        </div>

        {/* Primary metric */}
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-3xl font-light text-neutral-900 tabular-nums">
              ${atRiskArr.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">ARR at risk across {atRiskCount} account{atRiskCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold text-emerald-600 tabular-nums">
              +${opportunityCost.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">ARR saved by acting now</p>
          </div>
        </div>

        {/* Recovery comparison bar */}
        <div className="space-y-2.5 mb-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-neutral-700">Act on signals now</span>
              <span className="text-xs font-semibold text-emerald-600">${earlyRecovery.toLocaleString()} recovered · {earlyPct}%</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${earlyPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-400">Wait and react</span>
              <span className="text-xs text-neutral-400">${reactiveRecovery.toLocaleString()} recovered · {reactivePct}%</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-300 rounded-full transition-all duration-500"
                style={{ width: `${reactivePct}%` }}
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          Based on industry benchmarks: early signal detection recovers ~40% of at-risk ARR; reactive saves ~10%.
        </p>
      </div>
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onConnect, userName }: { onConnect: () => void; userName: string | null }) {
  return (
    <div className="max-w-md mx-auto pt-16 text-center">
      <div className="w-14 h-14 bg-[#25D366] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
        <WhatsAppIcon size={28} className="text-white" />
      </div>
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">
        {userName ? `Welcome, ${userName}` : "Account Intelligence"}
      </p>
      <h1 className="text-3xl font-light text-neutral-900 tracking-tight">
        What are your customers<br /><span className="text-neutral-400">actually telling you?</span>
      </h1>
      <p className="mt-4 text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">
        Connect a WhatsApp account group to extract churn signals, product pain points, and patterns your team would never catch manually.
      </p>
      <button onClick={onConnect} className="mt-8 flex items-center gap-2 bg-neutral-900 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-neutral-700 transition-colors mx-auto">
        <WhatsAppIcon size={14} className="text-white" />
        Connect first account
      </button>
      <p className="mt-4 text-xs text-neutral-400">Connect WhatsApp live · or upload .txt and .zip exports · Bahasa Indonesia + English</p>
    </div>
  )
}
