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
