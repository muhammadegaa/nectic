import type { StoredAccount } from "@/lib/concept-firestore"

export const ARR_BY_TIER: Record<string, number> = {
  starter: 6000,
  growth: 24000,
  enterprise: 60000,
}

export const DEFAULT_ARR = 12000

export const RISK_EXPOSURE: Record<string, number> = {
  critical: 1.0,
  high: 0.7,
  medium: 0.3,
  low: 0.05,
}

export function getAccountARR(account: StoredAccount): number {
  if (account.context?.annualValue && account.context.annualValue > 0) return account.context.annualValue
  return ARR_BY_TIER[account.context?.contractTier ?? ""] ?? DEFAULT_ARR
}

export function getArrAtRisk(account: StoredAccount): number {
  return Math.round(getAccountARR(account) * (RISK_EXPOSURE[account.result.riskLevel] ?? 0.1))
}

export function formatARR(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n}`
}

/**
 * Compute ARR protected = sum of ARR from accounts where all signals are resolved (done/dismissed).
 * If withinDays is set, only counts accounts where at least one signal was resolved within that window.
 */
export function computeArrProtected(
  accounts: StoredAccount[],
  options?: { withinDays?: number }
): number {
  const cutoff = options?.withinDays
    ? Date.now() - options.withinDays * 24 * 60 * 60 * 1000
    : null

  return accounts.reduce((sum, account) => {
    const actions = Object.values(account.signalActions ?? {})
    const totalSignals = (account.result.riskSignals?.length ?? 0)
    if (totalSignals === 0) return sum

    const allResolved = actions.length > 0 && actions.every(
      (a) => a.status === "done" || a.status === "dismissed"
    )
    if (!allResolved) return sum

    if (cutoff) {
      const hasRecentResolution = actions.some((a) => {
        if (!a.resolvedAt) return false
        return new Date(a.resolvedAt).getTime() >= cutoff
      })
      if (!hasRecentResolution) return sum
    }

    return sum + getAccountARR(account)
  }, 0)
}

/**
 * Count signals actioned today (status set to done or dismissed today).
 */
export function countActionedToday(accounts: StoredAccount[]): number {
  const todayStr = new Date().toISOString().slice(0, 10)
  let count = 0
  for (const account of accounts) {
    for (const action of Object.values(account.signalActions ?? {})) {
      if (
        (action.status === "done" || action.status === "dismissed") &&
        action.resolvedAt?.startsWith(todayStr)
      ) {
        count++
      }
    }
  }
  return count
}
