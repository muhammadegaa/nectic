"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import ConceptNav from "@/components/concept-nav"
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
  isOnboardingComplete,
  saveSignalAction,
  signalKey,
  getAgentRun,
  type StoredAccount,
  type AccountContext,
  type ParticipantRole,
  type ParticipantRoles,
  type WorkspaceContext,
  type AgentRun,
} from "@/lib/concept-firestore"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"
import { trackEvent, identifyUser } from "@/lib/posthog"
import { getArrAtRisk, formatARR, computeArrProtected, countActionedToday } from "@/lib/arr-utils"

type ConnectStage = "instructions" | "upload" | "ready" | "analyzing" | "error"

type ReadyToSendEntry = { account: StoredAccount; title: string; draft: string; key: string }

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
  const searchParams = useSearchParams()

  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [workspace, setWorkspace] = useState<WorkspaceContext>({})
  const [showConnect, setShowConnect] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
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
  const [agentRun, setAgentRun] = useState<AgentRun | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace("/concept/login"); return }
    isOnboardingComplete(user.uid).then((done) => {
      if (!done) router.replace("/concept/onboarding")
    })
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
    getAgentRun(user.uid).then(setAgentRun).catch(() => {})
    // Show founder welcome once per browser
    if (typeof window !== "undefined" && !localStorage.getItem("nectic_welcome_seen")) {
      const t = setTimeout(() => setShowWelcome(true), 1200)
      return () => clearTimeout(t)
    }
  }, [user])

  const refreshAccounts = async () => {
    if (!user) return
    const updated = await getAccounts(user.uid)
    setAccounts(updated)
  }

  const openConnect = () => {
    setConnectStage("instructions")
    setParsed(null)
    setFileName("")
    setUploadError("")
    setParticipantRoles({})
    setAiSuggestedRoles(new Set())
    setClassifying(false)
    setContext({})
    setShowConnect(true)
  }

  // Phase 6 — detect ?openUpload=1 from onboarding step 3 and auto-open upload modal
  useEffect(() => {
    if (loadingAccounts) return
    if (searchParams.get("openUpload") === "1") {
      openConnect()
      router.replace("/concept")
    }
  }, [loadingAccounts, searchParams])

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
    const isValid = file.name.endsWith(".txt") || file.name.endsWith(".zip")
    if (!isValid) {
      setUploadError("Please upload a WhatsApp .txt export or .zip folder.")
      setConnectStage("error")
      return
    }
    setFileName(file.name)
    try {
      const p = await parseWhatsAppFile(file)
      if (p.messages.length < 1) {
        setUploadError("Couldn't parse this file. Make sure it's a WhatsApp chat export (.txt or .zip).")
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

  // Fire-and-forget: auto-generate drafts for critical/high risk signals immediately after analysis
  const autoDraftRiskSignals = async (uid: string, accountId: string, result: AnalysisResult) => {
    const signalsToAuto = (result.riskSignals ?? []).filter(
      (_, i) => i < 3 && (result.riskLevel === "critical" || result.riskLevel === "high")
    )
    if (!signalsToAuto.length) return
    const drafts = await Promise.allSettled(
      signalsToAuto.map(async (signal) => {
        const res = await fetch("/api/concept/draft-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signalTitle: signal.title ?? signal.explanation?.slice(0, 80) ?? "Risk signal",
            signalExplanation: signal.explanation,
            quote: signal.quote,
            signalCategory: "risk",
            accountName: result.accountName,
            workspace,
          }),
        })
        if (!res.ok) return null
        const data = await res.json()
        return { signal, draft: data.draft as string }
      })
    )
    await Promise.allSettled(
      drafts.map(async (r) => {
        if (r.status !== "fulfilled" || !r.value) return
        const { signal, draft } = r.value
        const key = signalKey("risk", signal.title ?? signal.explanation?.slice(0, 80) ?? "risk-signal")
        await saveSignalAction(uid, accountId, key, {
          status: "open",
          draftResponse: draft,
          updatedAt: new Date().toISOString(),
        })
      })
    )
  }

  const analyze = async () => {
    if (!parsed || !user) return
    setConnectStage("analyzing")
    setUploadError("")

    // Upload guard: warn when no customer messages detected after role assignment
    const customerNames = Object.entries(participantRoles)
      .filter(([, r]) => r === "customer")
      .map(([n]) => n)
    const customerMsgCount = parsed.messages.filter((m) => customerNames.includes(m.sender)).length
    if (customerNames.length > 0 && customerMsgCount < 3) {
      toast.warning("Very few customer messages detected — double-check participant roles for accuracy")
    }

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

      const text = await res.text()
      let data: { result?: AnalysisResult; error?: string }
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error("Analysis timed out. Please try again — large conversations occasionally need a second attempt.")
      }
      if (!res.ok) throw new Error(data.error || "Analysis failed")

      const shareToken = crypto.randomUUID()
      const saved = await saveAccount(user.uid, {
        fileName,
        analyzedAt: new Date().toISOString(),
        result: data.result as AnalysisResult,
        participantRoles,
        context,
        shareToken,
        workspaceVersion: workspace.version,
      })
      await mergeContactBook(user.uid, participantRoles)
      // Auto-draft responses for critical/high risk — skip when AI is uncertain (low confidence = likely bad input)
      const confidence = (data.result as AnalysisResult).analysisQuality?.confidence
      if (confidence !== "low") {
        autoDraftRiskSignals(user.uid, saved.id, data.result as AnalysisResult).catch(() => {})
      }

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

  const handleDelete = async (id: string) => {
    if (!user) return
    await deleteAccount(user.uid, id)
    setDeletingId(null)
    await refreshAccounts()
  }

  const handleSignalDone = async (accountId: string, key: string, draft: string) => {
    if (!user) return
    await saveSignalAction(user.uid, accountId, key, {
      status: "done",
      draftResponse: draft,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
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

  const readyToSendEntries: ReadyToSendEntry[] = accounts
    .filter((a) => a.result.riskLevel === "critical" || a.result.riskLevel === "high")
    .flatMap((account): ReadyToSendEntry[] => {
      const signals = account.result.riskSignals ?? []
      for (const sig of signals) {
        const t = (sig as { type?: string }).type ?? "risk"
        const sigTitle = (sig as { title?: string }).title || (sig.explanation ?? "").slice(0, 80)
        const k = signalKey(t, sigTitle)
        const action = account.signalActions?.[k]
        if (action?.draftResponse && action.status !== "done" && action.status !== "dismissed") {
          return [{ account, title: sigTitle, draft: action.draftResponse, key: k }]
        }
      }
      return []
    })
  const aggregated = aggregateSignals(accounts)
  const atRiskAccounts = accounts.filter((a) => a.result.riskLevel === "high" || a.result.riskLevel === "critical")
  const atRisk = atRiskAccounts.length
  const totalArrAtRisk = atRiskAccounts.reduce((sum, a) => sum + getArrAtRisk(a), 0)
  const sharedPatterns = aggregated.filter((s) => s.accountCount > 1)
  const hasWorkspace = !!(workspace.productDescription || workspace.featureAreas || workspace.roadmapFocus || workspace.knownIssues)

  const urgentSignalCount = accounts.reduce((sum, a) => {
    if (a.result.riskLevel !== "critical" && a.result.riskLevel !== "high") return sum
    const openSignals = (a.result.riskSignals?.length ?? 0) + (a.result.productSignals?.length ?? 0)
    const resolvedSignals = Object.values(a.signalActions ?? {}).filter((sa) => sa.status === "done" || sa.status === "dismissed").length
    return sum + Math.max(0, openSignals - resolvedSignals)
  }, 0)

  const savedThisMonth = computeArrProtected(accounts, { withinDays: 30 })
  const actionedToday = countActionedToday(accounts)

  return (
    <div className="min-h-screen bg-neutral-50">
      <ConceptNav
        active="accounts"
        urgentCount={urgentSignalCount}
        userLabel={user.displayName ?? user.email ?? undefined}
        onSignOut={() => signOut()}
        rightSlot={
          accounts.length > 0 && !loadingAccounts ? (
            <button onClick={openConnect} className="flex items-center gap-1.5 text-xs bg-neutral-900 text-white px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors font-medium">
              <WhatsAppIcon size={12} />
              <span className="hidden sm:inline">Connect account</span>
              <span className="sm:hidden">Connect</span>
            </button>
          ) : undefined
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">
        {loadingAccounts ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {accounts.length === 0 && (
              <EmptyState onConnect={openConnect} />
            )}
            {accounts.length > 0 && (
              <div className="space-y-5">
                {/* Agent Brief — hero, leads every session */}
                <AgentBriefCard agentRun={agentRun} accountCount={accounts.length} readyCount={readyToSendEntries.length} />

                {/* Portfolio KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <KPITile label="Accounts" value={`${accounts.length}`} />
                  <KPITile
                    label={atRisk > 0 ? "At risk" : "All healthy"}
                    value={atRisk > 0 ? `${atRisk}` : "✓"}
                    highlight={atRisk > 0 ? "red" : "green"}
                  />
                  <KPITile
                    label="ARR protected (30d)"
                    value={savedThisMonth > 0 ? formatARR(savedThisMonth) : "—"}
                    highlight={savedThisMonth > 0 ? "green" : undefined}
                  />
                  <KPITile
                    label="Actioned today"
                    value={actionedToday > 0 ? `${actionedToday}` : "—"}
                    highlight={actionedToday > 0 ? "green" : undefined}
                  />
                </div>

                {/* Ready to send — agent-prepared drafts awaiting approval */}
                {readyToSendEntries.length > 0 && (
                  <ReadyToSendSection entries={readyToSendEntries} workspace={workspace} onDone={handleSignalDone} />
                )}

                {/* Urgent CTA — only when no ready drafts but has urgent signals */}
                {urgentSignalCount > 0 && readyToSendEntries.length === 0 && (
                  <Link
                    href="/concept/board"
                    className="flex items-center justify-between bg-neutral-900 rounded-xl px-5 py-4 hover:bg-neutral-800 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{urgentSignalCount} signal{urgentSignalCount !== 1 ? "s" : ""} need attention</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Open inbox to generate responses and take action</p>
                    </div>
                    <span className="text-neutral-400 group-hover:translate-x-0.5 transition-transform text-lg">→</span>
                  </Link>
                )}

                {/* Workspace nudge */}
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
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                  >
                    {sortedAccounts.map((account) => (
                      <motion.div
                        key={account.id}
                        variants={{
                          hidden: { y: 12, opacity: 0 },
                          show: { y: 0, opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
                        }}
                      >
                        <AccountCard
                          account={account}
                          currentWorkspaceVersion={workspace.version}
                          onDelete={() => setDeletingId(account.id)}
                          confirmingDelete={deletingId === account.id}
                          onConfirmDelete={() => handleDelete(account.id)}
                          onCancelDelete={() => setDeletingId(null)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Cross-account product signals */}
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
                          +{aggregated.length - 4} more →
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
          onClose={closeConnect}
          onContinueToUpload={() => setConnectStage("upload")}
          onBackToInstructions={() => setConnectStage("instructions")}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onFileSelect={() => inputRef.current?.click()}
          onInputChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          onSetRole={setRole}
          onContextChange={setContext}
          onAnalyze={analyze}
          onRetry={() => { setConnectStage("upload"); setUploadError(""); if (inputRef.current) inputRef.current.value = "" }}
        />
      )}

      {/* Founder welcome — one-time, slide in from bottom-right */}
      {showWelcome && (
        <FounderWelcome onDismiss={() => {
          setShowWelcome(false)
          if (typeof window !== "undefined") localStorage.setItem("nectic_welcome_seen", "1")
        }} />
      )}
    </div>
  )
}

// ─── Agent Brief ──────────────────────────────────────────────────────────────

function AgentBriefCard({ agentRun, accountCount, readyCount }: { agentRun: AgentRun | null; accountCount: number; readyCount: number }) {
  if (agentRun) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-2 w-2 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-neutral-900">Nectic Agent</p>
            <span className="text-xs text-neutral-400">ran {timeAgo(agentRun.runAt)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-neutral-400">{agentRun.accountsScanned} scanned</span>
            {agentRun.alertsSent > 0 && <span className="font-semibold text-orange-600">{agentRun.alertsSent} alert{agentRun.alertsSent !== 1 ? "s" : ""} sent</span>}
            {readyCount > 0 && <span className="font-semibold text-emerald-600">{readyCount} ready to send</span>}
            {agentRun.alertsSent === 0 && readyCount === 0 && <span className="font-semibold text-emerald-600">all clear</span>}
          </div>
        </div>
        {agentRun.events.length > 0 && (
          <div className="space-y-1.5">
            {agentRun.events.slice(0, 5).map((ev, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ev.type === "alert" ? "bg-orange-400" : ev.type === "nudge" ? "bg-amber-400" : "bg-emerald-400"}`} />
                <span className="font-medium text-neutral-700 truncate max-w-[120px]">{ev.accountName}</span>
                <span className="text-neutral-400 truncate">{ev.detail}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="bg-neutral-900 rounded-xl px-5 py-5">
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="w-2 h-2 rounded-full bg-neutral-600 flex-shrink-0" />
        <p className="text-sm font-semibold text-white">Nectic Agent</p>
        <span className="text-xs text-neutral-500">· first scan at 9am UTC</span>
      </div>
      <p className="text-xs text-neutral-400 leading-relaxed">
        Watching {accountCount} account{accountCount !== 1 ? "s" : ""} daily — auto-alerts on unactioned critical signals, pre-drafts responses, and sends your weekly ARR digest.
      </p>
    </div>
  )
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

function KPITile({ label, value, highlight }: { label: string; value: string; highlight?: "red" | "green" }) {
  const bg = highlight === "red" ? "bg-red-50 border-red-200" : highlight === "green" ? "bg-emerald-50 border-emerald-200" : "bg-white border-neutral-200"
  const vColor = highlight === "red" ? "text-red-600" : highlight === "green" ? "text-emerald-600" : "text-neutral-900"
  const lColor = highlight === "red" ? "text-red-400" : highlight === "green" ? "text-emerald-500" : "text-neutral-400"
  return (
    <div className={`border rounded-xl px-4 py-3.5 ${bg}`}>
      <p className={`text-xl font-bold tabular-nums leading-none mb-1 ${vColor}`}>{value}</p>
      <p className={`text-[11px] font-medium ${lColor}`}>{label}</p>
    </div>
  )
}

// ─── Ready to Send ─────────────────────────────────────────────────────────────

function ReadyToSendSection({
  entries,
  workspace,
  onDone,
}: {
  entries: ReadyToSendEntry[]
  workspace: WorkspaceContext
  onDone: (accountId: string, key: string, draft: string) => Promise<void>
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
        <h2 className="text-xs font-semibold text-neutral-700">
          Ready to send — {entries.length} draft{entries.length !== 1 ? "s" : ""} prepared by agent
        </h2>
      </div>
      <div className="space-y-2">
        {entries.map(({ account, title, draft, key }) => (
          <ReadyToSendCard
            key={account.id + key}
            account={account}
            signalTitle={title}
            draft={draft}
            signalKey={key}
            workspace={workspace}
            onDone={onDone}
          />
        ))}
      </div>
    </div>
  )
}

function ReadyToSendCard({
  account,
  signalTitle,
  draft,
  signalKey: sigKey,
  workspace,
  onDone,
}: {
  account: StoredAccount
  signalTitle: string
  draft: string
  signalKey: string
  workspace: WorkspaceContext
  onDone: (accountId: string, key: string, draft: string) => Promise<void>
}) {
  const [sending, setSending] = useState(false)
  const [gone, setGone] = useState(false)
  const canSend = !!(account.context?.watiPhone && workspace.watiEndpoint && workspace.watiToken)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft)
    setGone(true)
    await onDone(account.id, sigKey, draft)
    toast.success(`Draft copied — signal marked done`)
  }

  const handleSend = async () => {
    if (!canSend) return
    setSending(true)
    try {
      const res = await fetch("/api/wati/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: workspace.watiEndpoint,
          token: workspace.watiToken,
          phoneNumber: account.context?.watiPhone,
          message: draft,
        }),
      })
      if (!res.ok) throw new Error("Send failed")
      setGone(true)
      await onDone(account.id, sigKey, draft)
      toast.success(`Sent via WhatsApp — signal marked done`)
    } catch {
      toast.error("Could not send. Try from the inbox.")
    } finally {
      setSending(false)
    }
  }

  if (gone) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-emerald-200 rounded-xl overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50/60 border-b border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
        <Link
          href={`/concept/account/${account.id}`}
          className="text-sm font-semibold text-neutral-900 hover:underline truncate flex-1 min-w-0"
        >
          {account.result.accountName}
        </Link>
        <span className="text-xs text-neutral-400 truncate max-w-[160px] flex-shrink-0 hidden sm:inline">{signalTitle}</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-neutral-600 leading-relaxed mb-3">&ldquo;{draft}&rdquo;</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${canSend ? "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400" : "bg-neutral-900 text-white border-transparent hover:bg-neutral-700"}`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy &amp; done
          </button>
          {canSend && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#25D366] text-white hover:bg-green-600 border border-green-600 transition-all disabled:opacity-60"
            >
              {sending ? (
                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <WhatsAppIcon size={11} className="text-white" />
                  Send
                </>
              )}
            </button>
          )}
          <Link href="/concept/board" className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors ml-auto">
            View in inbox →
          </Link>
        </div>
      </div>
    </motion.div>
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
  participantRoles, aiSuggestedRoles, classifying, context,
  onClose, onContinueToUpload, onBackToInstructions,
  onDrop, onDragOver, onDragLeave, onFileSelect, onInputChange,
  onSetRole, onContextChange, onAnalyze, onRetry,
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
  onClose: () => void
  onContinueToUpload: () => void
  onBackToInstructions: () => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onFileSelect: () => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSetRole: (name: string, role: ParticipantRole) => void
  onContextChange: (ctx: AccountContext) => void
  onAnalyze: () => void
  onRetry: () => void
}) {
  const subtitleMap: Record<ConnectStage, string> = {
    instructions: "Export a group chat to get started",
    upload: "Drop your export file",
    ready: "Review before analysis",
    analyzing: "Analysing…",
    error: "Something went wrong",
  }

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
                <p className="text-xs text-neutral-400">{subtitleMap[stage]}</p>
              </div>
            </div>
            {stage !== "analyzing" && (
              <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 transition-colors text-xl leading-none">×</button>
            )}
          </div>

          {/* Body — scrollable */}
          <div className="overflow-y-auto flex-1 px-6 py-5">

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
                      <p className="mt-3 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-1.5">
                        Large conversation — smart sampling applied. Recent messages + signal-rich history from the full period will be analysed.
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
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={context.annualValue ?? ""}
                        onChange={(e) => onContextChange({ ...context, annualValue: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="Annual contract value (optional)"
                        className="w-full text-xs border border-neutral-200 rounded-lg pl-6 pr-3 py-2 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-white"
                      />
                    </div>
                    <input
                      type="month"
                      value={context.renewalMonth ?? ""}
                      onChange={(e) => onContextChange({ ...context, renewalMonth: e.target.value || undefined })}
                      className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 focus:outline-none focus:border-neutral-400 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {stage === "analyzing" && (
              <div className="py-8 text-center">
                <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-semibold text-neutral-900">
                  {parsed ? `Analysing ${parsed.totalMessages} messages` : fileName ? `Analysing ${fileName}…` : "Analysing conversation…"}
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

function AccountCard({ account, currentWorkspaceVersion, onDelete, confirmingDelete, onConfirmDelete, onCancelDelete }: {
  account: StoredAccount; currentWorkspaceVersion?: number; onDelete: () => void; confirmingDelete: boolean; onConfirmDelete: () => void; onCancelDelete: () => void
}) {
  const risk = riskConfig[account.result.riskLevel] ?? riskConfig.medium
  const topRisk = account.result.riskSignals?.[0]
  const topProduct = account.result.productSignals?.[0]
  const changesSince = account.result.changesSince
  const competitors = account.result.competitorMentions ?? []
  const isCritical = account.result.riskLevel === "critical"
  const isHigh = account.result.riskLevel === "high"
  const score = account.result.healthScore ?? 0

  const totalSignals = (account.result.riskSignals?.length ?? 0) + (account.result.productSignals?.length ?? 0)
  const allActioned = totalSignals > 0 && Object.values(account.signalActions ?? {}).filter(
    a => a.status === "done" || a.status === "dismissed"
  ).length >= totalSignals
  const wasCritical = (account.result.riskLevel === "critical" || account.result.riskLevel === "high")
  const isSaved = allActioned && wasCritical

  const arrAtRisk = getArrAtRisk(account)
  const showArrAtRisk = isCritical || isHigh

  const daysSinceUpdate = Math.floor((Date.now() - new Date(account.updatedAt ?? account.analyzedAt).getTime()) / (1000 * 60 * 60 * 24))
  const isStale = daysSinceUpdate >= 14 && (isCritical || isHigh)
  const isContextDrifted = currentWorkspaceVersion !== undefined
    && account.workspaceVersion !== undefined
    && account.workspaceVersion < currentWorkspaceVersion
  const isLowConfidence = account.result.analysisQuality?.confidence === "low"
  const scoreBarColor = isCritical ? "bg-red-500" : isHigh ? "bg-orange-400" : account.result.riskLevel === "medium" ? "bg-amber-400" : "bg-emerald-500"

  const healthDelta = changesSince?.healthDelta ?? 0
  const deltaPositive = healthDelta > 0
  const deltaNegative = healthDelta < 0

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
              {competitors.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  ⚡ {competitors[0]}
                </span>
              )}
              {isStale && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200" title={`Last analysed ${daysSinceUpdate} days ago — re-analyse to get current picture`}>
                  {daysSinceUpdate}d stale
                </span>
              )}
              {isContextDrifted && !isStale && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200" title="Workspace context was updated after this analysis — results may not reflect your current product">
                  Context updated
                </span>
              )}
              {isLowConfidence && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-50 text-neutral-400 border border-neutral-200" title="AI had low confidence in this analysis — consider re-uploading with more messages">
                  Low confidence
                </span>
              )}
              {isSaved && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Saved
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-neutral-900 truncate">{account.result.accountName}</p>
            {changesSince ? (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded tabular-nums ${deltaPositive ? "bg-emerald-50 text-emerald-700" : deltaNegative ? "bg-red-50 text-red-600" : "bg-neutral-50 text-neutral-400"}`}>
                  {deltaPositive ? `↑ +${healthDelta}` : deltaNegative ? `↓ ${healthDelta}` : "→ 0"}
                </span>
                <p className={`text-xs line-clamp-1 leading-relaxed ${deltaPositive ? "text-emerald-600" : deltaNegative ? "text-red-500" : "text-neutral-400"}`}>
                  {changesSince.summary}
                </p>
              </div>
            ) : topRisk ? (
              <p className="mt-1.5 text-xs text-neutral-400 line-clamp-1 italic leading-relaxed">&ldquo;{topRisk.quote}&rdquo;</p>
            ) : topProduct ? (
              <p className="mt-1.5 text-xs text-neutral-400 line-clamp-1">{topProduct.title}</p>
            ) : null}
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
          <span title={`Analysis from ${new Date(account.updatedAt ?? account.analyzedAt).toLocaleDateString()}`}>
            Last checked {timeAgo(account.updatedAt ?? account.analyzedAt)}
          </span>
          {account.context?.industry && (
            <><span className="text-neutral-200">·</span><span className="capitalize">{account.context.industry}</span></>
          )}
          {showArrAtRisk && (
            <span className="ml-auto font-semibold text-red-500 tabular-nums">
              {formatARR(arrAtRisk)} at risk
            </span>
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

function RevenueAtRisk({ atRiskCount, savedCount, topAccountId, topAccountName, actualArrAtRisk }: {
  atRiskCount: number
  savedCount: number
  topAccountId?: string
  topAccountName?: string
  actualArrAtRisk?: number
}) {
  const [acv, setAcv] = useState(10000)
  const [customAcv, setCustomAcv] = useState("")
  const [showCustom, setShowCustom] = useState(false)

  // Use real per-account ARR if available, otherwise fall back to count × ACV picker
  const usingRealArr = actualArrAtRisk !== undefined && actualArrAtRisk > 0
  const effectiveAcv = showCustom ? (parseInt(customAcv.replace(/\D/g, "")) || 0) : acv
  const atRiskArr = usingRealArr ? actualArrAtRisk : atRiskCount * effectiveAcv
  const earlyRecovery = Math.round(atRiskArr * 0.40)
  const reactiveRecovery = Math.round(atRiskArr * 0.10)
  const opportunityCost = earlyRecovery - reactiveRecovery
  const earlyPct = atRiskArr > 0 ? Math.round((earlyRecovery / atRiskArr) * 100) : 40
  const reactivePct = atRiskArr > 0 ? Math.round((reactiveRecovery / atRiskArr) * 100) : 10
  const arrProtected = savedCount * (usingRealArr ? Math.round(atRiskArr / atRiskCount) : effectiveAcv)

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
        {/* ACV selector — hidden when using real per-account ARR */}
        {!usingRealArr && (
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
        )}
        {usingRealArr && (
          <p className="text-[11px] text-emerald-600 font-medium mb-3">Using real ACV from account data</p>
        )}

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

        {arrProtected > 0 && (
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs text-neutral-500">ARR protected this month</span>
            <span className="text-sm font-semibold text-emerald-600 tabular-nums">${arrProtected.toLocaleString()}</span>
          </div>
        )}

        <p className="text-xs text-neutral-400 leading-relaxed mt-3">
          Based on industry benchmarks: early signal detection recovers ~40% of at-risk ARR; reactive saves ~10%.
        </p>
      </div>
    </div>
  )
}

// ─── Founder welcome ──────────────────────────────────────────────────────────

function FounderWelcome({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 9000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-neutral-900 text-white rounded-xl shadow-2xl px-5 py-4 relative">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-300 transition-colors"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 text-neutral-900 font-bold text-xs">M</div>
          <div>
            <p className="text-xs font-semibold text-white leading-none">Muhammad</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">Founder, Nectic</p>
          </div>
        </div>
        <p className="text-sm text-neutral-200 leading-relaxed">
          Most teams find their first real churn signal in the first account they analyze — something their sales rep never escalated. I built Nectic so that signal reaches you before it&apos;s too late.
        </p>
        <p className="text-xs text-neutral-500 mt-2.5">Start by connecting your first WhatsApp account below.</p>
        <div className="mt-3 h-0.5 bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full" style={{ animation: "shrink 9s linear forwards" }} />
        </div>
      </div>
      <style>{`@keyframes shrink { from { width: 100% } to { width: 0% } }`}</style>
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="max-w-lg mx-auto bg-white border border-neutral-200 rounded-2xl p-8 mt-12">
      <div className="w-10 h-10 flex items-center justify-center mb-5">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-neutral-900 mb-2">Your accounts will appear here</h2>
      <p className="text-sm text-neutral-500 leading-relaxed mb-6">
        Upload a WhatsApp conversation to get started. Nectic analyzes the chat and surfaces churn signals, product feedback, and recommended actions.
      </p>

      <div className="space-y-2.5 mb-6">
        {[
          "Export a WhatsApp chat (group or 1:1 with customer)",
          "Upload the .txt or .zip — Nectic analyzes it in ~60s",
          "See signals, draft replies, track actions",
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
            <p className="text-sm text-neutral-600">{step}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onConnect}
        className="w-full bg-neutral-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-neutral-700 transition-colors"
      >
        Upload first account →
      </button>
      <p className="mt-3 text-xs text-neutral-400 text-center">
        How to export: WhatsApp → conversation → ⋮ → Export chat → Without media
      </p>
    </div>
  )
}
