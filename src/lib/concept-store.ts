import type { AnalysisResult } from "@/app/api/concept/analyze/route"

export interface StoredAccount {
  id: string
  fileName: string
  analyzedAt: string
  result: AnalysisResult
}

export interface AggregatedSignal {
  title: string
  type: string
  priority: string
  pmAction: string
  accountCount: number
  accountNames: string[]
  quotes: string[]
}

const KEY = "nectic_concept_accounts"

export function getAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]")
  } catch {
    return []
  }
}

export function saveAccount(data: Omit<StoredAccount, "id">): StoredAccount {
  const accounts = getAccounts()
  const newAccount: StoredAccount = { ...data, id: crypto.randomUUID() }
  localStorage.setItem(KEY, JSON.stringify([newAccount, ...accounts]))
  return newAccount
}

export function getAccount(id: string): StoredAccount | null {
  return getAccounts().find((a) => a.id === id) ?? null
}

export function deleteAccount(id: string): void {
  const accounts = getAccounts().filter((a) => a.id !== id)
  localStorage.setItem(KEY, JSON.stringify(accounts))
}

export function aggregateSignals(accounts: StoredAccount[]): AggregatedSignal[] {
  const map = new Map<string, AggregatedSignal>()

  for (const account of accounts) {
    const seen = new Set<string>()
    for (const sig of account.result.productSignals ?? []) {
      const key = sig.title.toLowerCase().trim()
      if (seen.has(key)) continue
      seen.add(key)

      if (map.has(key)) {
        const existing = map.get(key)!
        existing.accountCount++
        existing.accountNames.push(account.result.accountName)
        if (sig.quote) existing.quotes.push(sig.quote)
      } else {
        map.set(key, {
          title: sig.title,
          type: sig.type,
          priority: sig.priority,
          pmAction: sig.pmAction,
          accountCount: 1,
          accountNames: [account.result.accountName],
          quotes: sig.quote ? [sig.quote] : [],
        })
      }
    }
  }

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }

  return Array.from(map.values()).sort((a, b) => {
    if (b.accountCount !== a.accountCount) return b.accountCount - a.accountCount
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  })
}
