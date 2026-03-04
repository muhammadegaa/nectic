"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { useAuth } from "@/contexts/auth-context"
import {
  getAccounts,
  saveSignalAction,
  signalKey,
  type StoredAccount,
  type SignalAction,
  type SignalActionStatus,
} from "@/lib/concept-firestore"

// ─── Types ────────────────────────────────────────────────────────────────────

interface BoardSignal {
  accountId: string
  accountName: string
  riskLevel: string
  signalCategory: "risk" | "product"
  type: string
  title: string
  priority: string
  quote: string
  pmAction?: string
  key: string
  action?: SignalAction
}

type FilterStatus = "needs_action" | "in_progress" | "done" | "all"

const ACTION_OPTIONS: { value: SignalActionStatus; label: string; color: string; bg: string }[] = [
  { value: "open", label: "Open", color: "text-neutral-500", bg: "bg-neutral-100 border-neutral-200" },
  { value: "in_progress", label: "In progress", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  { value: "done", label: "Done", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  { value: "dismissed", label: "Dismissed", color: "text-neutral-400", bg: "bg-neutral-50 border-neutral-200" },
]

const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const prioOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }

function extractSignals(accounts: StoredAccount[]): BoardSignal[] {
  const signals: BoardSignal[] = []
  for (const account of accounts) {
    const r = account.result
    for (const s of r.riskSignals ?? []) {
      const sType = (s as { type?: string }).type ?? "risk"
      const sTitle = s.explanation.slice(0, 80)
      const key = signalKey(sType, sTitle)
      signals.push({
        accountId: account.id,
        accountName: r.accountName,
        riskLevel: r.riskLevel,
        signalCategory: "risk",
        type: sType,
        title: sTitle,
        priority: s.severity ?? "medium",
        quote: s.quote,
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
        signalCategory: "product",
        type: s.type,
        title: s.title,
        priority: s.priority,
        quote: s.quote,
        pmAction: s.pmAction,
        key,
        action: account.signalActions?.[key],
      })
    }
  }
  return signals.sort((a, b) => {
    const riskDiff = (riskOrder[a.riskLevel] ?? 3) - (riskOrder[b.riskLevel] ?? 3)
    if (riskDiff !== 0) return riskDiff
    return (prioOrder[a.priority] ?? 2) - (prioOrder[b.priority] ?? 2)
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BoardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>("needs_action")
  const [signals, setSignals] = useState<BoardSignal[]>([])

  useEffect(() => {
    if (!authLoading && !user) router.replace("/concept/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    getAccounts(user.uid)
      .then((accs) => {
        setAccounts(accs)
        setSignals(extractSignals(accs))
      })
      .finally(() => setLoading(false))
  }, [user])

  const updateSignalAction = async (accountId: string, key: string, action: SignalAction) => {
    if (!user) return
    await saveSignalAction(user.uid, accountId, key, action)
    setAccounts((prev) => {
      const updated = prev.map((a) =>
        a.id === accountId
          ? { ...a, signalActions: { ...a.signalActions, [key]: action } }
          : a
      )
      setSignals(extractSignals(updated))
      return updated
    })
  }

  const filtered = signals.filter((s) => {
    const status = s.action?.status ?? "open"
    if (filter === "needs_action") return status === "open"
    if (filter === "in_progress") return status === "in_progress"
    if (filter === "done") return status === "done" || status === "dismissed"
    return true
  })

  const openCount = signals.filter((s) => !s.action || s.action.status === "open").length
  const inProgressCount = signals.filter((s) => s.action?.status === "in_progress").length
  const doneCount = signals.filter((s) => s.action?.status === "done" || s.action?.status === "dismissed").length

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b border-neutral-200 px-4 sm:px-6 h-12 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <LogoIcon size={20} />
            <span className="text-sm font-semibold text-neutral-900">Nectic</span>
          </Link>
          <span className="text-neutral-200">·</span>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/concept" className="text-neutral-400 hover:text-neutral-700 transition-colors">Accounts</Link>
            <span className="text-neutral-900 font-semibold border-b-2 border-neutral-900 pb-0.5">Signal board</span>
            <Link href="/concept/workspace" className="text-neutral-400 hover:text-neutral-700 transition-colors">Workspace</Link>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="hidden sm:block">{user.displayName ?? user.email}</span>
          <button onClick={() => signOut()} className="hover:text-neutral-700 transition-colors">Sign out</button>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-10 flex">
        <Link href="/concept" className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-neutral-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <span className="text-[10px] font-medium">Accounts</span>
        </Link>
        <Link href="/concept/board" className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-neutral-900">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
          <span className="text-[10px] font-semibold">Signals</span>
        </Link>
        <Link href="/concept/workspace" className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-neutral-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
          <span className="text-[10px] font-medium">Workspace</span>
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Signal board</h1>
            <p className="text-sm text-neutral-500 mt-0.5">All signals across accounts, sorted by urgency.</p>
          </div>
        </div>

        {/* Stats + filter */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {(
            [
              { key: "needs_action", label: "Needs action", count: openCount, active: "bg-red-50 text-red-700 border-red-200" },
              { key: "in_progress", label: "In progress", count: inProgressCount, active: "bg-amber-50 text-amber-700 border-amber-200" },
              { key: "done", label: "Done", count: doneCount, active: "bg-green-50 text-green-700 border-green-200" },
              { key: "all", label: "All", count: signals.length, active: "bg-neutral-900 text-white border-neutral-900" },
            ] as { key: FilterStatus; label: string; count: number; active: string }[]
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                filter === f.key ? f.active : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300"
              }`}
            >
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${filter === f.key ? "bg-white/20" : "bg-neutral-100 text-neutral-600"}`}>{f.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-lg py-16 text-center">
            {filter === "needs_action" ? (
              <>
                <p className="text-2xl mb-2">All clear</p>
                <p className="text-sm text-neutral-400">No open signals. Every signal has been addressed.</p>
              </>
            ) : (
              <p className="text-sm text-neutral-400">No signals in this view.</p>
            )}
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {filtered.map((s) => (
                <BoardSignalRow
                  key={`${s.accountId}-${s.key}`}
                  signal={s}
                  onUpdate={(action) => updateSignalAction(s.accountId, s.key, action)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Signal row ───────────────────────────────────────────────────────────────

function BoardSignalRow({
  signal,
  onUpdate,
}: {
  signal: BoardSignal
  onUpdate: (action: SignalAction) => void
}) {
  const [status, setStatus] = useState<SignalActionStatus>(signal.action?.status ?? "open")
  const [note, setNote] = useState(signal.action?.note ?? "")
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setStatus(signal.action?.status ?? "open")
    setNote(signal.action?.note ?? "")
  }, [signal.action])

  const riskColors: Record<string, string> = {
    critical: "bg-red-500",
    high: "bg-orange-400",
    medium: "bg-amber-400",
    low: "bg-green-400",
  }
  const typeLabel: Record<string, string> = {
    complaint: "Complaint",
    feature_request: "Feature req",
    praise: "Praise",
    confusion: "Confusion",
    risk: "Risk",
  }
  const typeColor: Record<string, string> = {
    complaint: "bg-red-50 text-red-700 border-red-200",
    feature_request: "bg-blue-50 text-blue-700 border-blue-200",
    praise: "bg-green-50 text-green-700 border-green-200",
    confusion: "bg-amber-50 text-amber-700 border-amber-200",
    risk: "bg-red-50 text-red-600 border-red-200",
  }
  const currentAction = ACTION_OPTIONS.find((o) => o.value === status)!

  const handleStatus = (next: SignalActionStatus) => {
    setStatus(next)
    onUpdate({ status: next, note: note || undefined, updatedAt: new Date().toISOString() })
    if (next !== "open") setExpanded(true)
  }

  const handleNoteSave = () => {
    onUpdate({ status, note: note || undefined, updatedAt: new Date().toISOString() })
  }

  return (
    <div className={`px-4 sm:px-5 py-4 ${status === "done" || status === "dismissed" ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Account risk dot */}
        <div className="flex-shrink-0 mt-1.5">
          <div className={`w-2 h-2 rounded-full ${riskColors[signal.riskLevel] ?? "bg-neutral-300"}`} title={signal.riskLevel} />
        </div>

        {/* Signal content + actions stacked */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link
              href={`/concept/account/${signal.accountId}`}
              className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:underline transition-colors"
            >
              {signal.accountName}
            </Link>
            <span className="text-neutral-200">·</span>
            <span className={`text-xs font-medium px-2 py-0.5 border rounded-full ${typeColor[signal.type] ?? typeColor.risk}`}>
              {typeLabel[signal.type] ?? signal.type}
            </span>
            <span className={`text-xs font-semibold ${signal.priority === "high" ? "text-red-500" : signal.priority === "medium" ? "text-amber-500" : "text-neutral-400"}`}>
              {signal.priority}
            </span>
          </div>
          <p className={`text-sm text-neutral-800 font-medium mb-1 ${status === "done" ? "line-through text-neutral-400" : ""}`}>
            {signal.title}
          </p>
          <p className="text-xs text-neutral-400 italic leading-relaxed line-clamp-2">&ldquo;{signal.quote}&rdquo;</p>

          {/* Saved note display */}
          {signal.action?.note && !expanded && (
            <p className="text-xs text-neutral-500 mt-1.5 bg-neutral-50 border border-neutral-100 rounded px-2 py-1">
              {signal.action.note}
            </p>
          )}

          {/* Note input when expanded */}
          {expanded && (
            <div className="mt-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={handleNoteSave}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNoteSave(); setExpanded(false) } }}
                placeholder="What was decided or done…"
                autoFocus
                className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-700 focus:outline-none focus:border-neutral-400 bg-white"
              />
            </div>
          )}

          {/* Status controls — always below content, wraps naturally on mobile */}
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-0.5 p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
              {ACTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatus(opt.value)}
                  title={opt.label}
                  className={`text-xs font-medium px-2 sm:px-2.5 py-1 rounded-md transition-all ${
                    status === opt.value
                      ? `${opt.bg} border shadow-sm ${opt.color}`
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
                {expanded ? "hide note" : note ? "edit note" : "+ add note"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
