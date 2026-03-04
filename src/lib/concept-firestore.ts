"use client"

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/infrastructure/firebase/firebase-client"
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

function accountsRef(uid: string) {
  return collection(db, "users", uid, "accounts")
}

export async function getAccounts(uid: string): Promise<StoredAccount[]> {
  const q = query(accountsRef(uid), orderBy("analyzedAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StoredAccount))
}

export async function saveAccount(
  uid: string,
  data: Omit<StoredAccount, "id">
): Promise<StoredAccount> {
  const ref = doc(accountsRef(uid))
  await setDoc(ref, { ...data, _createdAt: serverTimestamp() })
  return { id: ref.id, ...data }
}

export async function getAccount(uid: string, id: string): Promise<StoredAccount | null> {
  const snap = await getDoc(doc(accountsRef(uid), id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as StoredAccount
}

export async function deleteAccount(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(accountsRef(uid), id))
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
