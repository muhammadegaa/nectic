"use client"

import { useEffect, useState, useCallback, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import ConceptNav from "@/components/concept-nav"
import { HealthSparkline } from "@/components/health-sparkline"
import { useAuth } from "@/contexts/auth-context"
import {
  getAccounts,
  saveSignalAction,
  recalculateHealthFromResolutions,
  signalKey,
  getWorkspace,
  saveDraftExample,
  checkAndAutoSuppress,
  type StoredAccount,
  type SignalAction,
  type SignalActionStatus,
  type SaveEvent,
  type WorkspaceContext,
} from "@/lib/concept-firestore"
import { getAccountARR, getArrAtRisk, formatARR, computeArrProtected, countActionedToday } from "@/lib/arr-utils"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface QueueSignal {
  accountId: string
  accountName: string
  riskLevel: string
  analysisConfidence?: "high" | "medium" | "low"
  watiPhone?: string
  type: string
  title: string
  explanation?: string
  severity?: string
  date?: string
  quote: string
  key: string
  action?: SignalAction
}

const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const riskWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
const confidenceWeight: Record<string, number> = { high: 1.0, medium: 0.75, low: 0.4 }

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const riskDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-amber-400",
  low: "bg-emerald-400",
}

const riskBadge: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

function getTopRiskSignal(account: StoredAccount, suppressed: string[] = []): QueueSignal | null {
  const signals = (account.result.riskSignals ?? []).filter((s) => {
    const t = (s as { type?: string }).type ?? "risk"
    return !suppressed.includes(t)
  })
  if (signals.length === 0) return null

  const sorted = [...signals].sort((a, b) => {
    const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    return (sevOrder[(a as { severity?: string }).severity ?? "medium"] ?? 2) -
           (sevOrder[(b as { severity?: string }).severity ?? "medium"] ?? 2)
  })

  const s = sorted[0]
  const sType = (s as { type?: string }).type ?? "risk"
  const sTitle = (s as { title?: string }).title || s.explanation.slice(0, 80)
  const key = signalKey(sType, sTitle)
  const action = account.signalActions?.[key]

  if (action?.status === "done" || action?.status === "dismissed") {
    for (let i = 1; i < sorted.length; i++) {
      const sig = sorted[i]
      const t = (sig as { type?: string }).type ?? "risk"
      const ttl = (sig as { title?: string }).title || sig.explanation.slice(0, 80)
      const k = signalKey(t, ttl)
      const a = account.signalActions?.[k]
      if (!a || (a.status !== "done" && a.status !== "dismissed")) {
        return {
          accountId: account.id,
          accountName: account.result.accountName,
          riskLevel: account.result.riskLevel,
          watiPhone: account.context?.watiPhone,
          type: t,
          title: ttl,
          explanation: sig.explanation,
          severity: (sig as { severity?: string }).severity,
          date: (sig as { date?: string }).date,
          quote: sig.quote,
          key: k,
          action: a,
        }
      }
    }
    return null
  }

  return {
    accountId: account.id,
    accountName: account.result.accountName,
    riskLevel: account.result.riskLevel,
    analysisConfidence: account.result.analysisQuality?.confidence,
    watiPhone: account.context?.watiPhone,
    type: sType,
    title: sTitle,
    explanation: s.explanation,
    severity: (s as { severity?: string }).severity,
    date: (s as { date?: string }).date,
    quote: s.quote,
    key,
    action,
  }
}

function countOpenSignals(account: StoredAccount, suppressed: string[] = []): number {
  const allSignals = [
    ...(account.result.riskSignals ?? [])
      .filter((s) => !suppressed.includes((s as { type?: string }).type ?? "risk"))
      .map((s) => {
        const t = (s as { type?: string }).type ?? "risk"
        return signalKey(t, (s as { title?: string }).title || s.explanation.slice(0, 80))
      }),
    ...(account.result.productSignals ?? [])
      .filter((s) => !suppressed.includes(s.type))
      .map((s) => signalKey(s.type, s.title)),
  ]
  return allSignals.filter((k) => {
    const a = account.signalActions?.[k]
    return !a || (a.status !== "done" && a.status !== "dismissed")
  }).length
}

interface QueueEntry {
  account: StoredAccount
  topSignal: QueueSignal
  openCount: number
  arrAtRisk: number
}

function buildQueue(accounts: StoredAccount[], suppressed: string[] = []): QueueEntry[] {
  const entries: QueueEntry[] = []
  for (const account of accounts) {
    const topSignal = getTopRiskSignal(account, suppressed)
    if (!topSignal) continue
    entries.push({
      account,
      topSignal,
      openCount: countOpenSignals(account, suppressed),
      arrAtRisk: getArrAtRisk(account),
    })
  }
  // Confidence-weighted sort: a critical account with low-confidence analysis
  // should not blindly outrank a high account with high-confidence analysis.
  return entries.sort((a, b) => {
    const scoreA = (riskWeight[a.account.result.riskLevel] ?? 1) * (confidenceWeight[a.topSignal.analysisConfidence ?? "high"] ?? 1)
    const scoreB = (riskWeight[b.account.result.riskLevel] ?? 1) * (confidenceWeight[b.topSignal.analysisConfidence ?? "high"] ?? 1)
    if (scoreB !== scoreA) return scoreB - scoreA
    // Tiebreak: more ARR at risk first
    return b.arrAtRisk - a.arrAtRisk
  })
}

// ─── Page ───────────────────────────────────────────────────────────────────────

function QueuePageInner() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusAccountId = searchParams.get("account")
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [workspace, setWorkspace] = useState<WorkspaceContext>({})
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [statsView, setStatsView] = useState<"week" | "all">("week")

  useEffect(() => {
    if (!authLoading && !user) router.replace("/concept/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([getAccounts(user.uid), getWorkspace(user.uid)])
      .then(([accs, ws]) => {
        setAccounts(accs)
        setQueue(buildQueue(accs, ws.suppressedSignalTypes ?? []))
        setWorkspace(ws)
      })
      .finally(() => setLoading(false))
  }, [user])

  // Deep-link from email alert: ?account=ID → scroll to that card
  useEffect(() => {
    if (!focusAccountId || loading) return
    const el = cardRefs.current.get(focusAccountId)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      el.classList.add("ring-2", "ring-neutral-900", "ring-offset-2")
      setTimeout(() => el.classList.remove("ring-2", "ring-neutral-900", "ring-offset-2"), 3000)
    }
  }, [focusAccountId, loading])

  // Refresh every 8s for 90s after load — picks up auto-generated drafts
  useEffect(() => {
    if (!user) return
    let count = 0
    const interval = setInterval(async () => {
      count++
      if (count > 11) { clearInterval(interval); return }
      const accs = await getAccounts(user.uid).catch(() => null)
      if (!accs) return
      // Detect newly appeared drafts and notify
      setAccounts((prev) => {
        const prevDrafted = new Set(prev.flatMap(a =>
          Object.values(a.signalActions ?? {}).filter(s => s.draftResponse).map(() => a.id)
        ))
        const newDrafts = accs.filter(a =>
          !prevDrafted.has(a.id) &&
          Object.values(a.signalActions ?? {}).some(s => s.draftResponse)
        )
        if (newDrafts.length > 0) {
          toast.success(`Draft${newDrafts.length > 1 ? "s" : ""} ready — ${newDrafts.map(a => a.result.accountName).join(", ")}`)
        }
        return accs
      })
      setQueue(buildQueue(accs, workspace.suppressedSignalTypes ?? []))
    }, 8000)
    return () => clearInterval(interval)
  }, [user])

  const updateSignalAction = useCallback(async (
    accountId: string,
    key: string,
    action: SignalAction
  ) => {
    if (!user) return
    await saveSignalAction(user.uid, accountId, key, action)
    if (action.status === "done") {
      const newScore = await recalculateHealthFromResolutions(user.uid, accountId)
      if (newScore !== null) {
        const name = accounts.find((a) => a.id === accountId)?.result.accountName ?? "account"
        toast.success(`Health score updated to ${newScore}/10 for ${name}`)
      }
    }
    setAccounts((prev) => {
      const updated = prev.map((a) =>
        a.id === accountId
          ? { ...a, signalActions: { ...a.signalActions, [key]: action } }
          : a
      )
      setQueue(buildQueue(updated))
      return updated
    })
  }, [user, accounts])

  // Revenue metrics
  const totalArrAtRisk = accounts
    .filter((a) => {
      if (a.result.riskLevel !== "critical" && a.result.riskLevel !== "high") return false
      return countOpenSignals(a) > 0
    })
    .reduce((sum, a) => sum + getArrAtRisk(a), 0)

  const arrProtected = computeArrProtected(
    accounts,
    statsView === "week" ? { withinDays: 7 } : undefined
  )
  const actionedToday = countActionedToday(accounts)

  const urgentCount = accounts.reduce((sum, a) => {
    if (a.result.riskLevel !== "critical" && a.result.riskLevel !== "high") return sum
    return sum + countOpenSignals(a)
  }, 0)

  const readyQueue = queue.filter((e) => !!(e.topSignal.action?.draftResponse))
  const pendingQueue = queue.filter((e) => !e.topSignal.action?.draftResponse)

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <ConceptNav
        active="board"
        urgentCount={urgentCount}
        userLabel={user.displayName ?? user.email ?? undefined}
        onSignOut={() => signOut()}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">

        {/* Page header */}
        <div className="mb-6">
          {loading ? (
            <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse mb-1" />
          ) : queue.length > 0 ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight leading-none">
                  {queue.length} account{queue.length !== 1 ? "s" : ""} need{queue.length === 1 ? "s" : ""} action
                </h1>
                {totalArrAtRisk > 0 && (
                  <p className="text-sm text-red-600 font-semibold mt-1">{formatARR(totalArrAtRisk)} ARR at risk</p>
                )}
              </div>
              <div className="flex items-center gap-1 border border-neutral-200 rounded-lg overflow-hidden shrink-0 mt-0.5">
                <button onClick={() => setStatsView("week")} className={`text-xs px-2.5 py-1 font-medium transition-colors ${statsView === "week" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-700"}`}>Week</button>
                <button onClick={() => setStatsView("all")} className={`text-xs px-2.5 py-1 font-medium transition-colors ${statsView === "all" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-700"}`}>All time</button>
              </div>
            </div>
          ) : accounts.length > 0 ? (
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">All clear</h1>
              <p className="text-sm text-neutral-500 mt-1">Every signal has been addressed.</p>
            </div>
          ) : null}
        </div>

        {/* Stats strip — only when there's data */}
        {!loading && accounts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">ARR protected</p>
              <p className="text-xl font-bold text-emerald-600 tabular-nums">
                <motion.span key={`${arrProtected}-${statsView}`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300 }} className="inline-block">
                  {arrProtected > 0 ? formatARR(arrProtected) : "—"}
                </motion.span>
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">{statsView === "week" ? "this week" : "all time"}</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 shadow-sm">
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Actioned today</p>
              <p className="text-xl font-bold text-neutral-900 tabular-nums">
                <motion.span key={actionedToday} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300 }} className="inline-block">
                  {actionedToday > 0 ? actionedToday : "—"}
                </motion.span>
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">signals resolved</p>
            </div>
          </div>
        )}
        {!loading && accounts.length > 0 && <SavesPanel accounts={accounts} statsView={statsView} />}

        {/* Inbox */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-xl h-40 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-neutral-200 rounded-xl py-16 text-center"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <polyline points="2 8 6 12 14 4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-neutral-800 mb-1">Inbox clear</p>
            <p className="text-xs text-neutral-400">Every signal has been addressed. Well done.</p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {readyQueue.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <p className="text-xs font-semibold text-neutral-700">
                    Ready to send — {readyQueue.length} response{readyQueue.length !== 1 ? "s" : ""} drafted
                  </p>
                </div>
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                  className="space-y-3"
                >
                  {readyQueue.map((entry) => (
                    <QueueCard
                      key={entry.account.id}
                      entry={entry}
                      workspace={workspace}
                      onUpdate={(key, action) => updateSignalAction(entry.account.id, key, action)}
                      getIdToken={() => user?.getIdToken() ?? Promise.resolve(undefined)}
                      uid={user?.uid}
                      cardRef={(el) => { if (el) cardRefs.current.set(entry.account.id, el); else cardRefs.current.delete(entry.account.id) }}
                    />
                  ))}
                </motion.div>
              </div>
            )}
            {pendingQueue.length > 0 && (
              <div>
                {readyQueue.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 flex-shrink-0" />
                    <p className="text-xs font-semibold text-neutral-400">
                      Needs attention — {pendingQueue.length} account{pendingQueue.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                  className="space-y-3"
                >
                  {pendingQueue.map((entry) => (
                    <QueueCard
                      key={entry.account.id}
                      entry={entry}
                      workspace={workspace}
                      onUpdate={(key, action) => updateSignalAction(entry.account.id, key, action)}
                      getIdToken={() => user?.getIdToken() ?? Promise.resolve(undefined)}
                      uid={user?.uid}
                      cardRef={(el) => { if (el) cardRefs.current.set(entry.account.id, el); else cardRefs.current.delete(entry.account.id) }}
                    />
                  ))}
                </motion.div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Queue Card ────────────────────────────────────────────────────────────────

function QueueCard({
  entry,
  workspace,
  onUpdate,
  getIdToken,
  uid,
  cardRef,
}: {
  entry: QueueEntry
  workspace: WorkspaceContext
  onUpdate: (key: string, action: SignalAction) => void
  getIdToken: () => Promise<string | undefined>
  uid?: string
  cardRef?: (el: HTMLDivElement | null) => void
}) {
  const { account, topSignal, openCount, arrAtRisk } = entry
  const risk = account.result.riskLevel
  const [draft, setDraft] = useState(topSignal.action?.draftResponse ?? "")
  const originalDraft = topSignal.action?.draftResponse ?? ""
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftTone, setDraftTone] = useState<"shorter" | "more_formal" | "bahasa" | undefined>(undefined)
  const [copyDone, setCopyDone] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendDone, setSendDone] = useState(false)
  const [askQuestion, setAskQuestion] = useState("")
  const [askAnswer, setAskAnswer] = useState("")
  const [askLoading, setAskLoading] = useState(false)

  useEffect(() => {
    const incoming = topSignal.action?.draftResponse ?? ""
    if (incoming && !draft) setDraft(incoming)
  }, [topSignal.action?.draftResponse])

  const saveAction = (updates: Partial<SignalAction>) => {
    onUpdate(topSignal.key, {
      status: topSignal.action?.status ?? "open",
      ...topSignal.action,
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  }

  const handleDismiss = async () => {
    onUpdate(topSignal.key, {
      status: "dismissed",
      draftResponse: draft || undefined,
      updatedAt: new Date().toISOString(),
    })
    // Auto-suppress if this signal type keeps getting dismissed
    if (uid) {
      const suppressed = await checkAndAutoSuppress(uid, topSignal.type).catch(() => false)
      if (suppressed) toast("This alert type is now hidden — re-enable it in Settings → Alerts if needed.", { icon: "🔕" })
    }
  }

  const handleCopyAndDone = async () => {
    if (!draft) return
    await navigator.clipboard.writeText(draft)
    setCopyDone(true)
    const resolvedAt = new Date().toISOString()
    onUpdate(topSignal.key, {
      status: "done",
      draftResponse: draft,
      resolvedAt,
      updatedAt: resolvedAt,
    })
    // Capture draft edit as learning example
    if (uid && originalDraft && draft !== originalDraft) {
      saveDraftExample(uid, originalDraft, draft, topSignal.type).catch(() => {})
    }
    toast.success("Draft copied — signal marked done")
    setTimeout(() => setCopyDone(false), 3000)
  }

  const canSend = !!(topSignal.watiPhone && draft)

  const handleSend = async () => {
    if (!canSend) return
    setSending(true)
    try {
      const token = await getIdToken()
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jid: topSignal.watiPhone, text: draft }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Send failed")
      setSendDone(true)
      const resolvedAt = new Date().toISOString()
      onUpdate(topSignal.key, { status: "done", draftResponse: draft, resolvedAt, updatedAt: resolvedAt })
      // Capture draft edit as learning example
      if (uid && originalDraft && draft !== originalDraft) {
        saveDraftExample(uid, originalDraft, draft, topSignal.type).catch(() => {})
      }
      toast.success("Message sent via WhatsApp — signal marked done")
      setTimeout(() => setSendDone(false), 4000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message.")
    } finally {
      setSending(false)
    }
  }

  const generateDraft = async (tone?: "shorter" | "more_formal" | "bahasa") => {
    setDraftLoading(true)
    try {
      const res = await fetch("/api/concept/draft-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalTitle: topSignal.title,
          signalExplanation: topSignal.explanation,
          quote: topSignal.quote,
          signalCategory: "risk",
          accountName: topSignal.accountName,
          workspace,
          tone,
          accountContext: {
            summary: account.result.summary,
            sentimentTrend: account.result.sentimentTrend,
            riskLevel: account.result.riskLevel,
            relationshipSignals: account.result.relationshipSignals,
            competitorMentions: account.result.competitorMentions,
            recommendedAction: account.result.recommendedAction,
            stats: account.result.stats,
            otherRiskSignals: account.result.riskSignals
              ?.filter((s) => (s.title ?? s.explanation.slice(0, 80)) !== topSignal.title)
              .map((s) => ({ title: s.title, explanation: s.explanation, severity: s.severity })),
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Draft failed")
      setDraft(data.draft)
      saveAction({ draftResponse: data.draft })
    } catch {
      toast.error("Could not generate draft. Try again.")
    } finally {
      setDraftLoading(false)
    }
  }

  const extraCount = openCount - 1
  const [showEvidence, setShowEvidence] = useState(risk === "critical")

  // Collect all evidence quotes across all signals for the evidence panel
  const allEvidence = [
    ...(account.result.riskSignals ?? []).flatMap((s) => {
      const title = (s as { title?: string }).title || s.explanation.slice(0, 60)
      const severity = (s as { severity?: string }).severity ?? "medium"
      const quotes = [s.quote, ...((s as { evidence?: string[] }).evidence ?? [])].filter(Boolean)
      return quotes.map((q, i) => ({ quote: q, label: title, tag: "risk" as const, severity, isFirst: i === 0 }))
    }),
    ...(account.result.productSignals ?? []).flatMap((s) => {
      const quotes = [s.quote].filter(Boolean)
      return quotes.map((q, i) => ({ quote: q, label: s.title, tag: "product" as const, severity: s.priority, isFirst: i === 0 }))
    }),
  ]

  return (
    <motion.div
      ref={cardRef}
      variants={{
        hidden: { y: 16, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
      }}
      className={`bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm transition-shadow border-l-4 ${
        risk === "critical" ? "border-l-red-500" : risk === "high" ? "border-l-orange-400" : risk === "medium" ? "border-l-amber-400" : "border-l-emerald-400"
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Link href={`/concept/account/${account.id}`} className="text-base font-bold text-neutral-900 hover:underline truncate">
              {account.result.accountName}
            </Link>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 border rounded-full shrink-0 ${riskBadge[risk] ?? ""}`}>
              {risk.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {(risk === "critical" || risk === "high") && arrAtRisk > 0 && (
              <span className="text-xs font-semibold text-red-600">{formatARR(arrAtRisk)} at risk</span>
            )}
            {account.healthHistory && account.healthHistory.length >= 2 && (
              <HealthSparkline history={account.healthHistory} width={48} height={16} />
            )}
            <span className="text-xs text-neutral-400">{account.result.healthScore ?? 0}/10 health</span>
            {account.lastAlertSentAt && (
              <span className="text-[10px] text-neutral-400">Alert {timeAgo(account.lastAlertSentAt)}</span>
            )}
          </div>
        </div>
        {openCount > 1 && (
          <Link href={`/concept/account/${account.id}`} className="text-[11px] text-neutral-400 hover:text-neutral-700 shrink-0 transition-colors">
            +{extraCount} more →
          </Link>
        )}
      </div>

      {/* Signal */}
      <div className="px-5 py-4">
        {/* ── CONVERSATION THREAD ─────────────────────────────────── */}
        <div className="mb-1 space-y-1.5">

          {/* Context bubbles (evidence) — shown above the signal bubble */}
          {(topSignal.action?.draftResponse !== undefined || allEvidence.length > 1) &&
            allEvidence.slice(1).map((item, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="w-6 h-6 rounded-full bg-neutral-200 flex-shrink-0 flex items-center justify-center mb-0.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                </div>
                <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-3 py-2 max-w-[85%]">
                  <p className="text-xs text-neutral-600 leading-relaxed">{item.quote}</p>
                </div>
              </div>
            ))
          }

          {/* Signal bubble — the triggering message, highlighted */}
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-neutral-200 flex-shrink-0 flex items-center justify-center mb-0.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className={`rounded-2xl rounded-bl-sm px-3 py-2.5 inline-block max-w-[85%] ${
                risk === "critical" ? "bg-red-50 border border-red-200" : risk === "high" ? "bg-orange-50 border border-orange-200" : "bg-neutral-100"
              }`}>
                <p className="text-sm text-neutral-800 leading-relaxed">{topSignal.quote}</p>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                  risk === "critical" ? "bg-red-50 text-red-600 border-red-200" : risk === "high" ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-amber-50 text-amber-600 border-amber-200"
                }`}>{topSignal.title.length > 45 ? topSignal.title.slice(0, 45) + "…" : topSignal.title}</span>
                {topSignal.explanation && (
                  <span className="text-[10px] text-neutral-400 truncate hidden sm:inline">{topSignal.explanation.slice(0, 60)}…</span>
                )}
              </div>
            </div>
          </div>

          {/* Divider with AI label */}
          <div className="flex items-center gap-2 py-2">
            <div className="flex-1 h-px bg-neutral-100" />
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              AI draft
            </span>
            <div className="flex-1 h-px bg-neutral-100" />
          </div>

          {/* Reply bubble — outgoing WA style, editable */}
          <div className="flex justify-end">
            {draftLoading ? (
              <div className="bg-[#dcf8c6] rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%] space-y-2 min-w-[160px]">
                <div className="h-3 bg-green-200 rounded animate-pulse w-full" />
                <div className="h-3 bg-green-200 rounded animate-pulse w-4/5" />
                <div className="h-3 bg-green-200 rounded animate-pulse w-3/5" />
              </div>
            ) : draft ? (
              <div className="bg-[#dcf8c6] rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%] relative group w-full">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => saveAction({ draftResponse: draft })}
                  rows={3}
                  className="w-full text-sm text-neutral-900 leading-relaxed resize-none focus:outline-none bg-transparent"
                />
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-green-200">
                  <div className="flex items-center gap-1">
                    {(["shorter", "more_formal", "bahasa"] as const).map((t) => (
                      <button key={t} onClick={() => { setDraftTone(t); generateDraft(t) }}
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border transition-colors ${draftTone === t ? "bg-neutral-800 text-white border-neutral-800" : "text-neutral-500 border-neutral-300 hover:border-neutral-500 bg-white"}`}>
                        {t === "shorter" ? "Shorter" : t === "more_formal" ? "Formal" : "Bahasa"}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setDraftTone(undefined); generateDraft() }} className="text-[10px] text-neutral-400 hover:text-neutral-700 transition-colors">
                    Regenerate
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => generateDraft()}
                className="w-full border-2 border-dashed border-neutral-200 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium text-neutral-400 py-5 hover:border-neutral-400 hover:text-neutral-700 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Generate AI reply
              </button>
            )}
          </div>
        </div>

        {/* ── ACTIONS ─────────────────────────────────────────────── */}
        <div className="mt-4 space-y-2">
          {/* Primary: Send */}
          {canSend && (
            <motion.button whileTap={{ scale: 0.99 }} onClick={handleSend} disabled={sending}
              className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl transition-all disabled:opacity-60 ${
                sendDone ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-[#25D366] text-white hover:bg-[#20b858]"
              }`}>
              {sendDone ? "Sent ✓" : sending
                ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Send via WhatsApp</>
              }
            </motion.button>
          )}

          {/* Secondary row */}
          <div className="flex items-center gap-2">
            <button onClick={handleDismiss} className="text-xs font-medium text-neutral-400 hover:text-neutral-700 px-3 py-2 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all">
              Dismiss
            </button>
            {draft && (
              <button onClick={handleCopyAndDone}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-all ${copyDone ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "text-neutral-500 border-neutral-200 hover:border-neutral-300 hover:text-neutral-700"}`}>
                {copyDone ? "Copied ✓" : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy &amp; done</>}
              </button>
            )}
            {!canSend && !workspace.whatsappDirectConnected && (
              <Link href="/concept/workspace" className="text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors ml-auto">
                Connect WhatsApp to reply directly →
              </Link>
            )}
            {extraCount > 0 && (
              <Link href={`/concept/account/${account.id}`} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors ml-auto">
                +{extraCount} more →
              </Link>
            )}
          </div>

          {/* Ask Nectic — collapsed by default */}
          <div className="border-t border-neutral-100 pt-2">
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!askQuestion.trim() || askLoading) return
              setAskLoading(true); setAskAnswer("")
              try {
                const res = await fetch("/api/concept/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: askQuestion, result: account.result, accountName: account.result.accountName }) })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error ?? "Failed")
                setAskAnswer(data.answer)
              } catch { setAskAnswer("Could not answer. Try again.") }
              finally { setAskLoading(false) }
            }} className="flex items-center gap-2">
              <input type="text" value={askQuestion} onChange={(e) => { setAskQuestion(e.target.value); setAskAnswer("") }}
                placeholder="Ask about this account…"
                className="flex-1 text-xs border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 bg-transparent transition-colors" />
              <button type="submit" disabled={!askQuestion.trim() || askLoading}
                className="text-xs font-medium px-3 py-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40 shrink-0">
                {askLoading ? <span className="w-3 h-3 rounded-full border border-neutral-400 border-t-neutral-700 animate-spin inline-block" /> : "Ask"}
              </button>
            </form>
            {askAnswer && <div className="mt-2 text-xs text-neutral-600 leading-relaxed bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2.5">{askAnswer}</div>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Saves Panel ────────────────────────────────────────────────────────────────
// Closed feedback loop made visible. Every resolved signal, who resolved it,
// health before/after, ARR value. This is the "agent did X → outcome Y" story.

const REASON_LABEL: Record<string, string> = {
  customer_confirmed: "Customer confirmed",
  issue_fixed: "Issue fixed",
  workaround_given: "Workaround given",
  false_positive: "False positive",
  no_action_needed: "No action needed",
}

const REASON_COLOR: Record<string, string> = {
  customer_confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  issue_fixed: "bg-blue-50 text-blue-700 border-blue-200",
  workaround_given: "bg-amber-50 text-amber-700 border-amber-200",
  false_positive: "bg-red-50 text-red-600 border-red-200",
  no_action_needed: "bg-neutral-100 text-neutral-500 border-neutral-200",
}

function SavesPanel({ accounts, statsView }: { accounts: StoredAccount[]; statsView: "week" | "all" }) {
  const [expanded, setExpanded] = useState(false)

  type EnrichedSaveEvent = SaveEvent & { accountName: string; accountId: string }

  const allEvents: EnrichedSaveEvent[] = accounts
    .flatMap((a) =>
      (a.saveEvents ?? []).map((e) => ({
        ...e,
        accountName: a.result.accountName,
        accountId: a.id,
      }))
    )
    .sort((a, b) => new Date(b.resolvedAt).getTime() - new Date(a.resolvedAt).getTime())

  const filtered = statsView === "week"
    ? allEvents.filter((e) => (Date.now() - new Date(e.resolvedAt).getTime()) / 86400000 <= 7)
    : allEvents

  const arrTotal = filtered
    .filter((e) => e.resolvedReason !== "false_positive")
    .reduce((sum, e) => sum + (e.arrValue ?? 0), 0)

  const falsePositiveCount = filtered.filter((e) => e.resolvedReason === "false_positive").length

  if (filtered.length === 0) return null

  return (
    <div className="mt-6">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-neutral-700">
            {filtered.length} signal{filtered.length !== 1 ? "s" : ""} resolved — {formatARR(arrTotal)} ARR protected
          </p>
          {falsePositiveCount > 0 && (
            <span className="text-[10px] text-neutral-400">· {falsePositiveCount} false positive{falsePositiveCount !== 1 ? "s" : ""}</span>
          )}
        </div>
        <svg
          width="12" height="12" viewBox="0 0 16 16" fill="none"
          className={`text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="3 6 8 11 13 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
              {filtered.map((e, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <Link
                        href={`/concept/account/${e.accountId}`}
                        className="text-xs font-semibold text-neutral-800 hover:underline truncate"
                      >
                        {e.accountName}
                      </Link>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border flex-shrink-0 ${REASON_COLOR[e.resolvedReason] ?? "bg-neutral-100 text-neutral-500 border-neutral-200"}`}>
                        {REASON_LABEL[e.resolvedReason] ?? e.resolvedReason}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 truncate">{e.signalTitle}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {e.healthBefore !== undefined && e.healthAfter !== undefined && (
                        <span className="text-[10px] text-neutral-400">
                          Health {e.healthBefore.toFixed(1)} → <span className="text-emerald-600 font-medium">{e.healthAfter.toFixed(1)}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-neutral-400">{formatARR(e.arrValue)}</span>
                      <span className="text-[10px] text-neutral-400">{timeAgo(e.resolvedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function QueuePage() {
  return (
    <Suspense>
      <QueuePageInner />
    </Suspense>
  )
}
