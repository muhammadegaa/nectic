"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import ConceptNav from "@/components/concept-nav"
import { useAuth } from "@/contexts/auth-context"
import { getAccounts, type StoredAccount } from "@/lib/concept-firestore"

const ARR_BY_TIER: Record<string, number> = {
  starter: 6000,
  growth: 24000,
  enterprise: 60000,
}
const DEFAULT_ARR = 12000

function getAccountARR(account: StoredAccount): number {
  if (account.context?.annualValue && account.context.annualValue > 0) return account.context.annualValue
  return ARR_BY_TIER[account.context?.contractTier ?? ""] ?? DEFAULT_ARR
}

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
  return Math.round(getAccountARR(account) * (RISK_EXPOSURE[account.result.riskLevel] ?? 0.1))
}

interface OutcomeMetrics {
  totalAccounts: number
  totalARR: number
  arrAtRisk: number
  arrProtected: number
  accountsSaved: number
  accountsAtRisk: number
  signalsActioned: number
  signalsOpen: number
  competitorThreats: number
  renewingThisMonth: StoredAccount[]
  criticalAccounts: StoredAccount[]
  savedAccounts: StoredAccount[]
  recentlyActioned: { account: StoredAccount; signalTitle: string; actionedAt: string }[]
}

function computeMetrics(accounts: StoredAccount[]): OutcomeMetrics {
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  let totalARR = 0
  let arrAtRisk = 0
  let arrProtected = 0
  let accountsSaved = 0
  let accountsAtRisk = 0
  let signalsActioned = 0
  let signalsOpen = 0
  let competitorThreats = 0
  const renewingThisMonth: StoredAccount[] = []
  const criticalAccounts: StoredAccount[] = []
  const savedAccounts: StoredAccount[] = []
  const recentlyActioned: OutcomeMetrics["recentlyActioned"] = []

  for (const acc of accounts) {
    const arr = getAccountARR(acc)
    totalARR += arr
    const risk = acc.result.riskLevel

    if (risk === "critical" || risk === "high") {
      arrAtRisk += getArrAtRisk(acc)
      accountsAtRisk++
    }
    if (risk === "critical") criticalAccounts.push(acc)

    // Count signal actions
    const actions = Object.values(acc.signalActions ?? {})
    for (const a of actions) {
      if (a.status === "done" || a.status === "dismissed") signalsActioned++
      else if (a.status === "open") signalsOpen++
    }

    // Protected: all signals resolved
    const allSignals = [
      ...(acc.result.riskSignals ?? []),
      ...(acc.result.productSignals ?? []),
    ]
    if (allSignals.length > 0) {
      const allDone = allSignals.every((_, i) => {
        const key = Object.keys(acc.signalActions ?? {})[i]
        const action = acc.signalActions?.[key]
        return action?.status === "done" || action?.status === "dismissed"
      })
      if (allDone && (risk === "high" || risk === "critical")) {
        arrProtected += arr
        accountsSaved++
        savedAccounts.push(acc)
      }
    }

    // changesSince saved
    if (
      acc.result.changesSince &&
      acc.result.changesSince.healthDelta > 2 &&
      (risk === "low" || risk === "medium") &&
      acc.updatedAt
    ) {
      arrProtected += arr
      accountsSaved++
      if (!savedAccounts.find((s) => s.id === acc.id)) savedAccounts.push(acc)
    }

    // Competitor threats
    if (acc.result.competitorMentions?.length > 0) competitorThreats++

    // Renewing this month
    if (acc.context?.renewalMonth === thisMonth) renewingThisMonth.push(acc)

    // Recently actioned signals
    for (const [key, action] of Object.entries(acc.signalActions ?? {})) {
      if (action.status === "done" && action.resolvedAt) {
        const resolvedDate = new Date(action.resolvedAt)
        const daysSince = (now.getTime() - resolvedDate.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSince <= 30) {
          const title = key.replace(/^[^-]+-/, "").replace(/-/g, " ").slice(0, 60)
          recentlyActioned.push({ account: acc, signalTitle: title, actionedAt: action.resolvedAt })
        }
      }
    }
  }

  recentlyActioned.sort((a, b) => new Date(b.actionedAt).getTime() - new Date(a.actionedAt).getTime())

  return {
    totalAccounts: accounts.length,
    totalARR,
    arrAtRisk,
    arrProtected,
    accountsSaved,
    accountsAtRisk,
    signalsActioned,
    signalsOpen,
    competitorThreats,
    renewingThisMonth,
    criticalAccounts,
    savedAccounts,
    recentlyActioned: recentlyActioned.slice(0, 8),
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (d === 0) return "today"
  if (d === 1) return "yesterday"
  return `${d}d ago`
}

const riskBadge: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

export default function OutcomesPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<OutcomeMetrics | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/concept/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    getAccounts(user.uid).then((accs) => {
      setAccounts(accs)
      setMetrics(computeMetrics(accs))
    }).finally(() => setLoading(false))
  }, [user])

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
        active="outcomes"
        userLabel={user.displayName ?? user.email ?? undefined}
        onSignOut={() => signOut()}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">

        <div className="mb-8">
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Outcomes</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Revenue protected and churn prevented by Nectic this month.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="bg-white border border-neutral-200 rounded-xl h-24 animate-pulse" />)}
          </div>
        ) : !metrics || accounts.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl py-20 text-center">
            <p className="text-sm font-semibold text-neutral-800 mb-2">No accounts yet</p>
            <p className="text-xs text-neutral-400 mb-6">Connect your first account to start tracking outcomes.</p>
            <Link href="/concept" className="inline-flex items-center bg-neutral-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-neutral-700 transition-colors">
              Go to accounts →
            </Link>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="space-y-6"
          >
            {/* Top metrics */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {[
                {
                  label: "ARR protected",
                  value: metrics.arrProtected > 0 ? formatARR(metrics.arrProtected) : "—",
                  sub: `${metrics.accountsSaved} account${metrics.accountsSaved !== 1 ? "s" : ""} saved`,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50 border-emerald-100",
                },
                {
                  label: "ARR at risk",
                  value: metrics.arrAtRisk > 0 ? formatARR(metrics.arrAtRisk) : "—",
                  sub: `${metrics.accountsAtRisk} account${metrics.accountsAtRisk !== 1 ? "s" : ""} flagged`,
                  color: "text-red-600",
                  bg: "bg-red-50 border-red-100",
                },
                {
                  label: "Signals actioned",
                  value: String(metrics.signalsActioned),
                  sub: `${metrics.signalsOpen} still open`,
                  color: "text-neutral-900",
                  bg: "bg-white border-neutral-200",
                },
                {
                  label: "Competitor threats",
                  value: String(metrics.competitorThreats),
                  sub: metrics.competitorThreats > 0 ? "accounts with mentions" : "none detected",
                  color: metrics.competitorThreats > 0 ? "text-orange-600" : "text-neutral-400",
                  bg: "bg-white border-neutral-200",
                },
              ].map((m) => (
                <div key={m.label} className={`border rounded-xl px-4 py-4 ${m.bg}`}>
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">{m.label}</p>
                  <p className={`text-3xl font-light tabular-nums ${m.color}`}>{m.value}</p>
                  <p className="text-[11px] text-neutral-400 mt-1">{m.sub}</p>
                </div>
              ))}
            </motion.div>

            {/* Total ARR managed */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="bg-white border border-neutral-200 rounded-xl px-6 py-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">Total ARR under management</p>
                  <p className="text-4xl font-light text-neutral-900 tabular-nums">{formatARR(metrics.totalARR)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-400">{metrics.totalAccounts} accounts</p>
                  {metrics.renewingThisMonth.length > 0 && (
                    <p className="text-xs font-semibold text-orange-600 mt-1">{metrics.renewingThisMonth.length} renewing this month</p>
                  )}
                </div>
              </div>
              {/* ARR bar */}
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden flex">
                {metrics.arrProtected > 0 && (
                  <div
                    className="h-full bg-emerald-400 transition-all duration-700"
                    style={{ width: `${Math.min(100, (metrics.arrProtected / metrics.totalARR) * 100)}%` }}
                  />
                )}
                {metrics.arrAtRisk > 0 && (
                  <div
                    className="h-full bg-red-400 transition-all duration-700"
                    style={{ width: `${Math.min(100, (metrics.arrAtRisk / metrics.totalARR) * 100)}%` }}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[11px] text-neutral-500"><span className="w-2 h-2 rounded-full bg-emerald-400" />Protected</span>
                <span className="flex items-center gap-1.5 text-[11px] text-neutral-500"><span className="w-2 h-2 rounded-full bg-red-400" />At risk</span>
                <span className="flex items-center gap-1.5 text-[11px] text-neutral-500"><span className="w-2 h-2 rounded-full bg-neutral-200" />Healthy</span>
              </div>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Accounts saved */}
              {metrics.savedAccounts.length > 0 && (
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
                >
                  <div className="px-5 py-3.5 border-b border-neutral-100 bg-emerald-50 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><polyline points="2 8 6 12 14 4" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <p className="text-xs font-semibold text-emerald-700">Accounts recovered</p>
                  </div>
                  <div className="divide-y divide-neutral-50">
                    {metrics.savedAccounts.map((acc) => (
                      <Link
                        key={acc.id}
                        href={`/concept/account/${acc.id}`}
                        className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{acc.result.accountName}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{formatARR(getAccountARR(acc))} ARR · health {acc.result.healthScore}/10</p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300"><path d="M9 18l6-6-6-6"/></svg>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Critical needs attention */}
              {metrics.criticalAccounts.length > 0 && (
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
                >
                  <div className="px-5 py-3.5 border-b border-neutral-100 bg-red-50 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-xs font-semibold text-red-700">Critical — act now</p>
                  </div>
                  <div className="divide-y divide-neutral-50">
                    {metrics.criticalAccounts.map((acc) => (
                      <Link
                        key={acc.id}
                        href={`/concept/account/${acc.id}`}
                        className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{acc.result.accountName}</p>
                          <p className="text-xs text-red-500 mt-0.5">{formatARR(getArrAtRisk(acc))} at risk{acc.context?.renewalMonth ? ` · renews ${acc.context.renewalMonth}` : ""}</p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300"><path d="M9 18l6-6-6-6"/></svg>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Renewing this month */}
              {metrics.renewingThisMonth.length > 0 && (
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
                >
                  <div className="px-5 py-3.5 border-b border-neutral-100 bg-amber-50 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <p className="text-xs font-semibold text-amber-700">Renewing this month</p>
                  </div>
                  <div className="divide-y divide-neutral-50">
                    {metrics.renewingThisMonth.map((acc) => (
                      <Link
                        key={acc.id}
                        href={`/concept/account/${acc.id}`}
                        className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{acc.result.accountName}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            <span className={`font-medium ${riskBadge[acc.result.riskLevel] ? "" : ""}`}>{acc.result.riskLevel} risk</span>
                            {" · "}{formatARR(getAccountARR(acc))} ARR
                          </p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300"><path d="M9 18l6-6-6-6"/></svg>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recent actions taken */}
              {metrics.recentlyActioned.length > 0 && (
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
                >
                  <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <p className="text-xs font-semibold text-neutral-500">Actions taken (last 30 days)</p>
                  </div>
                  <div className="divide-y divide-neutral-50">
                    {metrics.recentlyActioned.map((item, i) => (
                      <Link
                        key={i}
                        href={`/concept/account/${item.account.id}`}
                        className="flex items-start justify-between px-5 py-3 hover:bg-neutral-50 transition-colors gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-neutral-700 truncate">{item.account.result.accountName}</p>
                          <p className="text-xs text-neutral-400 mt-0.5 truncate capitalize">{item.signalTitle}</p>
                        </div>
                        <span className="text-[11px] text-neutral-300 shrink-0 mt-0.5">{timeAgo(item.actionedAt)}</span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* NRR impact summary */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="bg-neutral-900 rounded-xl px-6 py-5 text-white"
            >
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">NRR impact estimate</p>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-2xl font-light tabular-nums text-emerald-400">{formatARR(metrics.arrProtected)}</p>
                  <p className="text-xs text-neutral-400 mt-1">ARR retained via early intervention</p>
                </div>
                <div>
                  <p className="text-2xl font-light tabular-nums text-white">{metrics.signalsActioned}</p>
                  <p className="text-xs text-neutral-400 mt-1">signals actioned before escalation</p>
                </div>
                <div>
                  <p className="text-2xl font-light tabular-nums text-red-400">{formatARR(metrics.arrAtRisk)}</p>
                  <p className="text-xs text-neutral-400 mt-1">ARR still exposed — needs action</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center justify-between">
                <p className="text-xs text-neutral-500">Based on {metrics.totalAccounts} accounts · {formatARR(metrics.totalARR)} total ARR managed</p>
                <Link href="/concept/board" className="text-xs font-semibold text-white hover:text-neutral-300 transition-colors">
                  Open queue →
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
