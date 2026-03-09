"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
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
  type StoredAccount,
  type SignalAction,
  type SignalActionStatus,
  type WorkspaceContext,
} from "@/lib/concept-firestore"
import { getAccountARR, getArrAtRisk, formatARR, computeArrProtected, countActionedToday } from "@/lib/arr-utils"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface QueueSignal {
  accountId: string
  accountName: string
  riskLevel: string
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

function getTopRiskSignal(account: StoredAccount): QueueSignal | null {
  const signals = account.result.riskSignals ?? []
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

function countOpenSignals(account: StoredAccount): number {
  const allSignals = [
    ...(account.result.riskSignals ?? []).map((s) => {
      const t = (s as { type?: string }).type ?? "risk"
      return signalKey(t, (s as { title?: string }).title || s.explanation.slice(0, 80))
    }),
    ...(account.result.productSignals ?? []).map((s) => signalKey(s.type, s.title)),
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

function buildQueue(accounts: StoredAccount[]): QueueEntry[] {
  const entries: QueueEntry[] = []
  for (const account of accounts) {
    const topSignal = getTopRiskSignal(account)
    if (!topSignal) continue
    entries.push({
      account,
      topSignal,
      openCount: countOpenSignals(account),
      arrAtRisk: getArrAtRisk(account),
    })
  }
  return entries.sort((a, b) => (riskOrder[a.account.result.riskLevel] ?? 3) - (riskOrder[b.account.result.riskLevel] ?? 3))
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function QueuePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
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
        setQueue(buildQueue(accs))
        setWorkspace(ws)
      })
      .finally(() => setLoading(false))
  }, [user])

  // Refresh every 8s for 90s after load — picks up auto-generated drafts
  useEffect(() => {
    if (!user) return
    let count = 0
    const interval = setInterval(async () => {
      count++
      if (count > 11) { clearInterval(interval); return }
      const accs = await getAccounts(user.uid).catch(() => null)
      if (!accs) return
      setAccounts(accs)
      setQueue(buildQueue(accs))
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

        {/* Revenue header */}
        {!loading && accounts.length > 0 && (
          <div className="mb-6">
            {/* Stats view toggle */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Performance</p>
              <div className="flex items-center gap-1 border border-neutral-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setStatsView("week")}
                  className={`text-xs px-2.5 py-1 font-medium transition-colors ${statsView === "week" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-700"}`}
                >
                  This week
                </button>
                <button
                  onClick={() => setStatsView("all")}
                  className={`text-xs px-2.5 py-1 font-medium transition-colors ${statsView === "all" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-700"}`}
                >
                  All time
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">ARR at risk</p>
                <p className="text-2xl font-bold text-red-600 tabular-nums">
                  <motion.span
                    key={totalArrAtRisk}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="inline-block"
                  >
                    {totalArrAtRisk > 0 ? formatARR(totalArrAtRisk) : "—"}
                  </motion.span>
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{accounts.filter((a) => a.result.riskLevel === "critical" || a.result.riskLevel === "high").length} accounts</p>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">ARR protected</p>
                <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                  <motion.span
                    key={`${arrProtected}-${statsView}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="inline-block"
                  >
                    {arrProtected > 0 ? formatARR(arrProtected) : "—"}
                  </motion.span>
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">signals actioned</p>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Needs action</p>
                <p className="text-2xl font-bold text-neutral-900 tabular-nums">
                  <motion.span
                    key={queue.length}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="inline-block"
                  >
                    {queue.length}
                  </motion.span>
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">accounts in queue</p>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Actioned today</p>
                <p className="text-2xl font-bold text-neutral-900 tabular-nums">
                  <motion.span
                    key={actionedToday}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="inline-block"
                  >
                    {actionedToday > 0 ? actionedToday : "—"}
                  </motion.span>
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">signals resolved</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-5">
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Action inbox</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {loading ? "Loading…" : queue.length === 0
              ? "Inbox clear — all accounts healthy."
              : `${queue.length} account${queue.length !== 1 ? "s" : ""} need${queue.length === 1 ? "s" : ""} attention.`}
          </p>
        </div>

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
                    Ready to review — {readyQueue.length} draft{readyQueue.length !== 1 ? "s" : ""} prepared by agent
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
                      Generate response — {pendingQueue.length} account{pendingQueue.length !== 1 ? "s" : ""}
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
}: {
  entry: QueueEntry
  workspace: WorkspaceContext
  onUpdate: (key: string, action: SignalAction) => void
}) {
  const { account, topSignal, openCount, arrAtRisk } = entry
  const risk = account.result.riskLevel
  const [draft, setDraft] = useState(topSignal.action?.draftResponse ?? "")
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

  const handleDismiss = () => {
    onUpdate(topSignal.key, {
      status: "dismissed",
      draftResponse: draft || undefined,
      updatedAt: new Date().toISOString(),
    })
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
    toast.success("Draft copied — signal marked done")
    setTimeout(() => setCopyDone(false), 3000)
  }

  const canSendViaWati = !!(topSignal.watiPhone && workspace.watiEndpoint && workspace.watiToken && draft)

  const handleSendViaWati = async () => {
    if (!canSendViaWati) return
    setSending(true)
    try {
      const res = await fetch("/api/wati/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: workspace.watiEndpoint,
          token: workspace.watiToken,
          phoneNumber: topSignal.watiPhone,
          message: draft,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Send failed")
      setSendDone(true)
      const resolvedAt = new Date().toISOString()
      onUpdate(topSignal.key, { status: "done", draftResponse: draft, resolvedAt, updatedAt: resolvedAt })
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

  return (
    <motion.div
      variants={{
        hidden: { y: 16, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
      }}
      className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm"
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-100 bg-neutral-50">
        <div className={`w-2 h-2 rounded-full shrink-0 ${riskDot[risk] ?? "bg-neutral-300"} ${risk === "critical" ? "animate-pulse" : ""}`} />
        <Link
          href={`/concept/account/${account.id}`}
          className="text-sm font-semibold text-neutral-900 hover:underline flex-1 min-w-0 truncate"
        >
          {account.result.accountName}
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          {account.lastAlertSentAt && (
            <span className="hidden sm:inline text-[10px] text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
              Alert {timeAgo(account.lastAlertSentAt)}
            </span>
          )}
          {account.healthHistory && account.healthHistory.length >= 2 && (
            <HealthSparkline history={account.healthHistory} width={56} height={20} />
          )}
          {(risk === "critical" || risk === "high") && (
            <span className="text-xs font-semibold text-red-600 tabular-nums hidden sm:inline">
              {formatARR(arrAtRisk)} at risk
            </span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 border rounded-full ${riskBadge[risk] ?? ""}`}>
            {risk}
          </span>
          <span className="text-xs text-neutral-400 tabular-nums">
            {account.result.healthScore ?? 0}/10
          </span>
        </div>
      </div>

      {/* Signal */}
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-neutral-900 mb-2 leading-snug">{topSignal.title}</p>
        <p className="text-xs text-neutral-400 italic leading-relaxed mb-4">&ldquo;{topSignal.quote}&rdquo;</p>

        {topSignal.explanation && (
          <div className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-100 mb-4">
            <span className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">Why this matters</span>
            {topSignal.explanation}
          </div>
        )}

        {/* Draft panel */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden mb-4">
          <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 border-b border-neutral-100">
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">WhatsApp draft</span>
            </div>
            {draft && (
              <button
                onClick={() => { setDraftTone(undefined); generateDraft() }}
                className="text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Regenerate
              </button>
            )}
          </div>
          <div className="px-3 py-2.5">
            {draftLoading ? (
              <div className="space-y-2">
                <div className="h-3 bg-neutral-100 rounded animate-pulse w-full" />
                <div className="h-3 bg-neutral-100 rounded animate-pulse w-4/5" />
                <div className="h-3 bg-neutral-100 rounded animate-pulse w-3/5" />
              </div>
            ) : draft ? (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => saveAction({ draftResponse: draft })}
                  rows={3}
                  className="w-full text-xs text-neutral-700 leading-relaxed resize-none focus:outline-none bg-transparent"
                />
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-neutral-100">
                  <span className="text-[10px] text-neutral-400 mr-0.5">Adjust:</span>
                  {(["shorter", "more_formal", "bahasa"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setDraftTone(t); generateDraft(t) }}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                        draftTone === t
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "text-neutral-500 border-neutral-200 hover:border-neutral-400 hover:text-neutral-700"
                      }`}
                    >
                      {t === "shorter" ? "Shorter" : t === "more_formal" ? "More formal" : "Bahasa"}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button
                onClick={() => generateDraft()}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium text-neutral-500 py-3 hover:text-neutral-900 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Generate draft response
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="text-xs font-medium text-neutral-400 hover:text-neutral-700 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-400 transition-all"
          >
            Dismiss
          </button>

          <AnimatePresence mode="wait">
            {draft && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleCopyAndDone}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border ${
                  copyDone
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : canSendViaWati
                    ? "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                    : "bg-neutral-900 text-white border-transparent hover:bg-neutral-700"
                }`}
              >
                {copyDone ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polyline points="2 8 6 12 14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    Copy &amp; done
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {canSendViaWati && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSendViaWati}
              disabled={sending}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-60 ${
                sendDone
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-green-600 text-white border-green-700 hover:bg-green-700"
              }`}
            >
              {sendDone ? "Sent" : sending ? (
                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  Send via WhatsApp
                </>
              )}
            </motion.button>
          )}

          {extraCount > 0 && (
            <Link
              href={`/concept/account/${account.id}`}
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors ml-auto"
            >
              +{extraCount} more signal{extraCount !== 1 ? "s" : ""} →
            </Link>
          )}
        </div>

        {!workspace.watiEndpoint && (
          <div className="mt-2 flex items-center gap-2 px-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366] flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <Link href="/concept/workspace" className="text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors">
              Connect WhatsApp to send directly →
            </Link>
          </div>
        )}

        {/* Ask Nectic */}
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!askQuestion.trim() || askLoading) return
              setAskLoading(true)
              setAskAnswer("")
              try {
                const res = await fetch("/api/concept/ask", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    question: askQuestion,
                    result: account.result,
                    accountName: account.result.accountName,
                  }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error ?? "Failed")
                setAskAnswer(data.answer)
              } catch {
                setAskAnswer("Could not answer. Try again.")
              } finally {
                setAskLoading(false)
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={askQuestion}
              onChange={(e) => { setAskQuestion(e.target.value); setAskAnswer("") }}
              placeholder="Ask about this account…"
              className="flex-1 text-xs border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 bg-neutral-50 transition-colors"
            />
            <button
              type="submit"
              disabled={!askQuestion.trim() || askLoading}
              className="text-xs font-medium px-3 py-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40 shrink-0"
            >
              {askLoading ? (
                <span className="w-3 h-3 rounded-full border border-neutral-400 border-t-neutral-700 animate-spin inline-block" />
              ) : "Ask"}
            </button>
          </form>
          {askAnswer && (
            <div className="mt-2 text-xs text-neutral-600 leading-relaxed bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2.5">
              {askAnswer}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
