"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import ConceptNav from "@/components/concept-nav"
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
import type { SuggestedAction } from "@/app/api/concept/analyze/route"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BoardSignal {
  accountId: string
  accountName: string
  riskLevel: string
  watiPhone?: string    // present for WATI-imported accounts; enables direct send
  signalCategory: "risk" | "product"
  type: string
  title: string
  explanation?: string
  priority: string
  severity?: string
  date?: string
  quote: string
  pmAction?: string
  problemStatement?: string
  suggestedActions?: SuggestedAction[]
  key: string
  action?: SignalAction
}

type FilterStatus = "needs_action" | "in_progress" | "done" | "dismissed" | "all"

const ACTION_OPTIONS: { value: SignalActionStatus; label: string; activeClass: string }[] = [
  { value: "open", label: "Open", activeClass: "bg-neutral-100 border-neutral-300 text-neutral-600" },
  { value: "in_progress", label: "In progress", activeClass: "bg-amber-50 border-amber-300 text-amber-700" },
  { value: "done", label: "Done", activeClass: "bg-emerald-50 border-emerald-300 text-emerald-700" },
  { value: "dismissed", label: "Dismissed", activeClass: "bg-neutral-50 border-neutral-200 text-neutral-400" },
]

const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const prioOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }

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

const typeBadge: Record<string, string> = {
  complaint: "bg-red-50 text-red-700 border-red-200",
  feature_request: "bg-blue-50 text-blue-700 border-blue-200",
  praise: "bg-emerald-50 text-emerald-700 border-emerald-200",
  confusion: "bg-amber-50 text-amber-700 border-amber-200",
  risk: "bg-red-50 text-red-600 border-red-200",
}

const typeLabel: Record<string, string> = {
  complaint: "Complaint",
  feature_request: "Feature request",
  praise: "Praise",
  confusion: "Confusion",
  risk: "Risk",
}

const ownerBadge: Record<string, string> = {
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

function extractSignalsForAccount(account: StoredAccount): BoardSignal[] {
  const signals: BoardSignal[] = []
  const r = account.result
  const watiPhone = account.context?.watiPhone
  for (const s of r.riskSignals ?? []) {
    const sType = (s as { type?: string }).type ?? "risk"
    const sDisplayTitle = (s as { title?: string }).title || s.explanation.slice(0, 80)
    const sKeyTitle = s.explanation.slice(0, 80)
    const key = signalKey(sType, sKeyTitle)
    signals.push({
      accountId: account.id,
      accountName: r.accountName,
      riskLevel: r.riskLevel,
      watiPhone,
      signalCategory: "risk",
      type: sType,
      title: sDisplayTitle,
      explanation: s.explanation,
      priority: s.severity ?? "medium",
      severity: s.severity,
      date: s.date,
      quote: s.quote,
      suggestedActions: (s as { suggestedActions?: SuggestedAction[] }).suggestedActions,
      key,
      action: account.signalActions?.[key],
    })
  }
  for (const s of r.productSignals ?? []) {
    const key = signalKey(s.type, s.title)
    signals.push({
      accountId: account.id,
      accountName: r.accountName,
      riskLevel: r.riskLevel,
      watiPhone,
      signalCategory: "product",
      type: s.type,
      title: s.title,
      priority: s.priority,
      quote: s.quote,
      pmAction: s.pmAction,
      problemStatement: s.problemStatement,
      suggestedActions: s.suggestedActions,
      key,
      action: account.signalActions?.[key],
    })
  }
  return signals.sort((a, b) => (prioOrder[a.priority] ?? 2) - (prioOrder[b.priority] ?? 2))
}

interface AccountGroup {
  account: StoredAccount
  signals: BoardSignal[]
  worstRisk: string
  openCount: number
}

function groupSignalsByAccount(accounts: StoredAccount[]): AccountGroup[] {
  const groups: AccountGroup[] = accounts.map((account) => {
    const signals = extractSignalsForAccount(account)
    const worstRisk = account.result.riskLevel
    const openCount = signals.filter((s) => !s.action || s.action.status === "open").length
    return { account, signals, worstRisk, openCount }
  })
  return groups
    .filter((g) => g.signals.length > 0)
    .sort((a, b) => (riskOrder[a.worstRisk] ?? 3) - (riskOrder[b.worstRisk] ?? 3))
}

function getAllSignals(groups: AccountGroup[]): BoardSignal[] {
  return groups.flatMap((g) => g.signals)
}

// ─── ARR helpers ────────────────────────────────────────────────────────────────

const ARR_BY_TIER: Record<string, number> = {
  starter: 6000,
  growth: 24000,
  enterprise: 60000,
}
const DEFAULT_ARR = 12000 // fallback if no tier set

function getAccountARR(account: StoredAccount): number {
  return ARR_BY_TIER[account.context?.contractTier ?? ""] ?? DEFAULT_ARR
}

// Fraction of ARR considered at risk by risk level
const RISK_EXPOSURE: Record<string, number> = {
  critical: 1.0,
  high: 0.7,
  medium: 0.3,
  low: 0.05,
}

function formatARR(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${Math.round(n / 1000)}K`
  return `$${n}`
}

function getArrAtRisk(account: StoredAccount): number {
  const arr = getAccountARR(account)
  const exposure = RISK_EXPOSURE[account.result.riskLevel] ?? 0.1
  return Math.round(arr * exposure)
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ActionQueuePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [workspace, setWorkspace] = useState<WorkspaceContext>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>("needs_action")
  const [groups, setGroups] = useState<AccountGroup[]>([])

  useEffect(() => {
    if (!authLoading && !user) router.replace("/concept/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([
      getAccounts(user.uid),
      getWorkspace(user.uid),
    ]).then(([accs, ws]) => {
      setAccounts(accs)
      setGroups(groupSignalsByAccount(accs))
      setWorkspace(ws)
    }).finally(() => setLoading(false))
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
        const acctName = accounts.find((a) => a.id === accountId)?.result.accountName ?? "account"
        toast.success(`Health score updated to ${newScore}/10 for ${acctName}`)
      }
    }
    setAccounts((prev) => {
      const updated = prev.map((a) =>
        a.id === accountId
          ? { ...a, signalActions: { ...a.signalActions, [key]: action } }
          : a
      )
      setGroups(groupSignalsByAccount(updated))
      return updated
    })
  }, [user, accounts])

  const signals = getAllSignals(groups)

  const signalMatchesFilter = (s: BoardSignal) => {
    const status = s.action?.status ?? "open"
    if (filter === "needs_action") return status === "open"
    if (filter === "in_progress") return status === "in_progress"
    if (filter === "done") return status === "done"
    if (filter === "dismissed") return status === "dismissed"
    return true
  }

  const filteredGroups = groups
    .map((g) => ({ ...g, signals: g.signals.filter(signalMatchesFilter) }))
    .filter((g) => g.signals.length > 0)

  const openCount = signals.filter((s) => !s.action || s.action.status === "open").length
  const inProgressCount = signals.filter((s) => s.action?.status === "in_progress").length
  const doneCount = signals.filter((s) => s.action?.status === "done").length
  const dismissedCount = signals.filter((s) => s.action?.status === "dismissed").length
  const criticalCount = signals.filter((s) => s.riskLevel === "critical" && (!s.action || s.action.status === "open")).length
  const highCount = signals.filter((s) => s.riskLevel === "high" && (!s.action || s.action.status === "open")).length
  const urgentCount = criticalCount + highCount

  // Revenue metrics
  const totalArrAtRisk = accounts
    .filter((a) => a.result.riskLevel === "critical" || a.result.riskLevel === "high")
    .reduce((sum, a) => sum + getArrAtRisk(a), 0)
  const arrProtected = accounts
    .filter((a) => {
      const sigs = extractSignalsForAccount(a)
      return sigs.length > 0 && sigs.every((s) => s.action?.status === "done" || s.action?.status === "dismissed")
    })
    .reduce((sum, a) => sum + getAccountARR(a), 0)
  const atRiskAccountCount = accounts.filter(
    (a) => a.result.riskLevel === "critical" || a.result.riskLevel === "high"
  ).length

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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">

        {/* Revenue dashboard header */}
        <div className="mb-6">
          {!loading && accounts.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">ARR at risk</p>
                <p className="text-2xl font-bold text-red-600 tabular-nums">{totalArrAtRisk > 0 ? formatARR(totalArrAtRisk) : "—"}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{atRiskAccountCount} account{atRiskAccountCount !== 1 ? "s" : ""} flagged</p>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">ARR protected</p>
                <p className="text-2xl font-bold text-emerald-600 tabular-nums">{arrProtected > 0 ? formatARR(arrProtected) : "—"}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{doneCount} action{doneCount !== 1 ? "s" : ""} completed</p>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Needs action</p>
                <p className="text-2xl font-bold text-neutral-900 tabular-nums">{openCount}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{inProgressCount} in progress</p>
              </div>
            </div>
          )}
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Revenue protection queue</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                {loading ? "Loading accounts…" : openCount === 0
                  ? "All signals addressed — no ARR at risk."
                  : `${openCount} signal${openCount !== 1 ? "s" : ""} need${openCount === 1 ? "s" : ""} attention across ${atRiskAccountCount > 0 ? atRiskAccountCount : groups.length} account${groups.length !== 1 ? "s" : ""}.`}
              </p>
            </div>
            {!loading && openCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {criticalCount > 0 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-semibold text-red-700">{criticalCount} critical</span>
                  </motion.div>
                )}
                {highCount > 0 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    <span className="text-xs font-semibold text-orange-700">{highCount} high risk</span>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 mb-5 relative">
          {(
            [
              { key: "needs_action", label: "Needs action", count: openCount, active: "text-red-700" },
              { key: "in_progress", label: "In progress", count: inProgressCount, active: "text-amber-700" },
              { key: "done", label: "Done", count: doneCount, active: "text-emerald-700" },
              { key: "dismissed", label: "Dismissed", count: dismissedCount, active: "text-neutral-600" },
              { key: "all", label: "All", count: signals.length, active: "text-neutral-900" },
            ] as { key: FilterStatus; label: string; count: number; active: string }[]
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`relative flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                filter === f.key
                  ? `bg-white border border-neutral-200 shadow-sm ${f.active}`
                  : "text-neutral-400 hover:text-neutral-600 hover:bg-white/60"
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`text-[11px] min-w-[18px] text-center px-1 py-0.5 rounded-md font-semibold tabular-nums ${
                  filter === f.key ? "bg-black/8" : "bg-neutral-100 text-neutral-400"
                }`}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Signal list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-xl h-24 animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-neutral-200 rounded-xl py-16 text-center"
          >
            {filter === "needs_action" ? (
              <>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                    <polyline points="2 8 6 12 14 4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-neutral-800 mb-1">Queue is clear</p>
                <p className="text-xs text-neutral-400">Every signal has been addressed. Check back after the next analysis.</p>
              </>
            ) : (
              <p className="text-sm text-neutral-400">No signals in this view.</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="space-y-4"
          >
            {filteredGroups.map((group) => (
              <AccountSignalGroup
                key={group.account.id}
                group={group}
                workspace={workspace}
                userId={user.uid}
                onUpdate={(key, action) => updateSignalAction(group.account.id, key, action)}
                onBrief={(key) => router.push(`/concept/account/${group.account.id}?brief=${key}`)}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  )
}

// ─── Account Signal Group ────────────────────────────────────────────────────────

function AccountSignalGroup({
  group,
  workspace,
  userId,
  onUpdate,
  onBrief,
}: {
  group: AccountGroup
  workspace: WorkspaceContext
  userId: string
  onUpdate: (key: string, action: SignalAction) => void
  onBrief: (key: string) => void
}) {
  const { account, signals } = group
  const [collapsed, setCollapsed] = useState(false)
  const risk = account.result.riskLevel
  const healthScore = account.result.healthScore ?? 0
  const arrExposure = getArrAtRisk(account)

  return (
    <motion.div
      variants={{
        hidden: { y: 16, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
      }}
      className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm"
    >
      {/* Group header */}
      <div
        className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-neutral-100 bg-neutral-50 cursor-pointer select-none"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${riskDot[risk] ?? "bg-neutral-300"} ${risk === "critical" ? "animate-pulse" : ""}`} />
        <Link
          href={`/concept/account/${account.id}`}
          className="text-sm font-semibold text-neutral-900 hover:underline flex-1 min-w-0 truncate"
          onClick={(e) => e.stopPropagation()}
        >
          {account.result.accountName}
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          {(risk === "critical" || risk === "high") && (
            <span className="text-xs font-semibold text-red-600 tabular-nums hidden sm:inline">
              {formatARR(arrExposure)} at risk
            </span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 border rounded-full ${riskBadge[risk] ?? ""}`}>
            {risk}
          </span>
          <span className="text-xs text-neutral-400 tabular-nums hidden sm:inline">
            {healthScore}/10
          </span>
          <span className="text-xs font-semibold text-neutral-500 bg-neutral-200 rounded-full px-2 py-0.5 tabular-nums">
            {signals.length}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-neutral-400 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Signals */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-neutral-100">
              {signals.map((s) => (
                <ActionCard
                  key={`${s.accountId}-${s.key}`}
                  signal={s}
                  workspace={workspace}
                  userId={userId}
                  onUpdate={(action) => onUpdate(s.key, action)}
                  onBrief={() => onBrief(s.key)}
                  isNested
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Action Card ────────────────────────────────────────────────────────────────

function ActionCard({
  signal,
  workspace,
  onUpdate,
  onBrief,
  isNested = false,
}: {
  signal: BoardSignal
  workspace: WorkspaceContext
  userId: string
  onUpdate: (action: SignalAction) => void
  onBrief: () => void
  isNested?: boolean
}) {
  const [status, setStatus] = useState<SignalActionStatus>(signal.action?.status ?? "open")
  const [note, setNote] = useState(signal.action?.note ?? "")
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState(signal.action?.draftResponse ?? "")
  const [draftLoading, setDraftLoading] = useState(false)
  const [adoptedIdx, setAdoptedIdx] = useState<number | null>(null)
  const [copyDone, setCopyDone] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendDone, setSendDone] = useState(false)

  useEffect(() => {
    setStatus(signal.action?.status ?? "open")
    setNote(signal.action?.note ?? "")
    setDraft(signal.action?.draftResponse ?? "")
  }, [signal.action])

  const isClosedOut = status === "done" || status === "dismissed"
  const canBrief = signal.signalCategory === "product" && (signal.type === "complaint" || signal.type === "feature_request") && signal.priority !== "low"

  const handleStatus = (next: SignalActionStatus) => {
    setStatus(next)
    const resolvedAt = next === "done" ? new Date().toISOString() : undefined
    onUpdate({ status: next, note: note || undefined, draftResponse: draft || undefined, resolvedAt, updatedAt: new Date().toISOString() })
    if (next !== "open") setExpanded(true)
  }

  const handleNoteSave = () => {
    onUpdate({ status, note: note || undefined, draftResponse: draft || undefined, updatedAt: new Date().toISOString() })
  }

  const handleAdoptStep = (idx: number, action: SuggestedAction) => {
    const newNote = `${action.owner}: ${action.step}`
    setNote(newNote)
    setStatus("in_progress")
    setAdoptedIdx(idx)
    setExpanded(true)
    onUpdate({ status: "in_progress", note: newNote, draftResponse: draft || undefined, updatedAt: new Date().toISOString() })
    setTimeout(() => setAdoptedIdx(null), 2000)
  }

  const generateDraft = async () => {
    setDraftLoading(true)
    setExpanded(true)
    try {
      const res = await fetch("/api/concept/draft-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalTitle: signal.title,
          signalExplanation: signal.explanation,
          quote: signal.quote,
          signalCategory: signal.signalCategory,
          accountName: signal.accountName,
          workspace,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Draft failed")
      setDraft(data.draft)
      onUpdate({ status, note: note || undefined, draftResponse: data.draft, updatedAt: new Date().toISOString() })
    } catch {
      toast.error("Could not generate draft. Try again.")
    } finally {
      setDraftLoading(false)
    }
  }

  const handleCopyAndDone = async () => {
    if (!draft) return
    await navigator.clipboard.writeText(draft)
    setCopyDone(true)
    setStatus("done")
    const resolvedAt = new Date().toISOString()
    onUpdate({ status: "done", note: note || undefined, draftResponse: draft, resolvedAt, updatedAt: resolvedAt })
    toast.success("Draft copied — signal marked done")
    setTimeout(() => setCopyDone(false), 3000)
  }

  const canSendViaWati = !!(signal.watiPhone && workspace.watiEndpoint && workspace.watiToken && draft)

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
          phoneNumber: signal.watiPhone,
          message: draft,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Send failed")
      setSendDone(true)
      setStatus("done")
      const resolvedAt = new Date().toISOString()
      onUpdate({ status: "done", note: note || undefined, draftResponse: draft, resolvedAt, updatedAt: resolvedAt })
      toast.success("Message sent via WhatsApp — signal marked done")
      setTimeout(() => setSendDone(false), 4000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message. Try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div
      layout
      variants={isNested ? {} : {
        hidden: { y: 16, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
      }}
      className={isNested
        ? `bg-white transition-all duration-200 ${isClosedOut ? "opacity-50" : ""}`
        : `bg-white border rounded-xl overflow-hidden transition-all duration-200 ${isClosedOut ? "border-neutral-100 opacity-50" : "border-neutral-200 hover:border-neutral-300 hover:shadow-sm"}`
      }
    >
      <div className="px-4 sm:px-5 py-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Risk dot */}
          <div className="flex-shrink-0 mt-1.5">
            <div className={`w-2 h-2 rounded-full ${riskDot[signal.riskLevel] ?? "bg-neutral-300"} ${signal.riskLevel === "critical" ? "animate-pulse" : ""}`} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {!isNested && (
                <>
                  <Link
                    href={`/concept/account/${signal.accountId}`}
                    className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:underline transition-colors"
                  >
                    {signal.accountName}
                  </Link>
                  <span className="text-neutral-200">·</span>
                </>
              )}
              <span className={`text-xs font-medium px-2 py-0.5 border rounded-full ${typeBadge[signal.type] ?? typeBadge.risk}`}>
                {typeLabel[signal.type] ?? signal.type}
              </span>
              {!isNested && (
                <span className={`text-xs font-medium px-2 py-0.5 border rounded-full ${riskBadge[signal.riskLevel] ?? ""}`}>
                  {signal.riskLevel}
                </span>
              )}
              {signal.signalCategory === "risk" && signal.severity && signal.severity !== signal.riskLevel && (
                <span className="text-[11px] font-semibold text-neutral-400">{signal.severity} severity</span>
              )}
              {signal.date && signal.signalCategory === "risk" && (
                <span className="text-[11px] text-neutral-400 ml-auto">{signal.date}</span>
              )}
            </div>

            {/* Signal title */}
            <p className={`text-sm font-semibold text-neutral-900 mb-1.5 leading-snug ${status === "done" ? "line-through text-neutral-400" : ""}`}>
              {signal.title}
            </p>

            {/* Quote */}
            <p className={`text-xs text-neutral-400 italic leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
              &ldquo;{signal.quote}&rdquo;
            </p>

            {/* Expanded details */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-3">
                    {/* Risk explanation */}
                    {signal.signalCategory === "risk" && signal.explanation && (
                      <div className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-100">
                        <span className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">Why this matters</span>
                        {signal.explanation}
                      </div>
                    )}

                    {/* Product: problem + PM action */}
                    {signal.signalCategory === "product" && (
                      <>
                        {signal.problemStatement && (
                          <div className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-100">
                            <span className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">Customer problem</span>
                            {signal.problemStatement}
                          </div>
                        )}
                        {signal.pmAction && (
                          <div className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-100">
                            <span className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">AI suggestion</span>
                            {signal.pmAction}
                          </div>
                        )}
                      </>
                    )}

                    {/* Suggested next steps */}
                    {signal.suggestedActions && signal.suggestedActions.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">Suggested next steps</p>
                        <div className="space-y-1.5">
                          {signal.suggestedActions.map((a, i) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.005 }}
                              whileTap={{ scale: 0.995 }}
                              onClick={() => handleAdoptStep(i, a)}
                              disabled={adoptedIdx === i || isClosedOut}
                              className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-lg border text-xs transition-all ${
                                adoptedIdx === i
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                  : isClosedOut
                                  ? "border-neutral-100 bg-white text-neutral-400 cursor-default"
                                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 cursor-pointer"
                              }`}
                            >
                              <span className="shrink-0 mt-0.5">
                                {adoptedIdx === i ? (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-neutral-300"><path d="M2.5 6h7M7 3.5L9.5 6 7 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                )}
                              </span>
                              <span className="flex-1 leading-snug">{a.step}</span>
                              <div className="shrink-0 flex items-center gap-1.5">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ownerBadge[a.owner] ?? "bg-neutral-100 text-neutral-500"}`}>
                                  {a.owner}
                                </span>
                                <span className="text-[10px] text-neutral-400 whitespace-nowrap">{timelineLabel[a.timeline] ?? a.timeline}</span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Draft response panel */}
                    <div className="border border-neutral-200 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 border-b border-neutral-100">
                        <div className="flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">WhatsApp draft</span>
                        </div>
                        {!draft && !draftLoading && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={generateDraft}
                            className="flex items-center gap-1 text-[11px] font-semibold text-neutral-700 bg-white border border-neutral-200 px-2.5 py-1 rounded-md hover:border-neutral-400 transition-all"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            Generate draft
                          </motion.button>
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
                              onBlur={() => onUpdate({ status, note: note || undefined, draftResponse: draft, updatedAt: new Date().toISOString() })}
                              rows={3}
                              className="w-full text-xs text-neutral-700 leading-relaxed resize-none focus:outline-none bg-transparent"
                            />
                            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 mt-1">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCopyAndDone}
                                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                                  copyDone
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-neutral-900 text-white hover:bg-neutral-700"
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
                                    Copy &amp; mark done
                                  </>
                                )}
                              </motion.button>
                              {canSendViaWati && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={handleSendViaWati}
                                  disabled={sending}
                                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-60 ${
                                    sendDone
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-green-600 text-white border-green-700 hover:bg-green-700"
                                  }`}
                                >
                                  {sendDone ? (
                                    <>
                                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polyline points="2 8 6 12 14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      Sent
                                    </>
                                  ) : sending ? (
                                    <>
                                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                      Sending…
                                    </>
                                  ) : (
                                    <>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                      Send via WhatsApp
                                    </>
                                  )}
                                </motion.button>
                              )}
                              <button
                                onClick={generateDraft}
                                className="text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors ml-auto"
                              >
                                Regenerate
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-neutral-400 py-1">AI will draft a WhatsApp response to send this customer about this signal.</p>
                        )}
                      </div>
                    </div>

                    {/* Note */}
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      onBlur={handleNoteSave}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNoteSave(); setExpanded(false) } }}
                      placeholder="Add a note — what was decided or done…"
                      className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-700 focus:outline-none focus:border-neutral-400 bg-white"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Saved note (collapsed) */}
            {!expanded && signal.action?.note && (
              <p className="text-xs text-neutral-500 mt-1.5 bg-neutral-50 border border-neutral-100 rounded px-2 py-1 truncate">
                {signal.action.note}
              </p>
            )}

            {/* Bottom controls */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {/* Status selector */}
              <div className="flex items-center gap-0.5 p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
                {ACTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatus(opt.value)}
                    title={opt.label}
                    className={`text-xs font-medium px-2 sm:px-2.5 py-1 rounded-md transition-all ${
                      status === opt.value
                        ? `${opt.activeClass} border shadow-sm`
                        : "text-neutral-400 hover:text-neutral-600 border border-transparent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                {expanded ? "Collapse" : signal.suggestedActions?.length ? `${signal.suggestedActions.length} steps →` : "Details →"}
              </button>

              {!expanded && signal.signalCategory === "risk" && !draft && (
                <button
                  onClick={generateDraft}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  Draft response
                </button>
              )}

              {canBrief && (
                <button
                  onClick={onBrief}
                  className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors ml-auto"
                >
                  Generate brief →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
