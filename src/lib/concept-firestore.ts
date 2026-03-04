"use client"

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/infrastructure/firebase/firebase-client"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParticipantRole = "vendor" | "customer" | "partner" | "other"
export type ParticipantRoles = Record<string, ParticipantRole>

export interface AccountContext {
  industry?: string
  contractTier?: "starter" | "growth" | "enterprise"
  renewalMonth?: string // "YYYY-MM"
}

export interface WorkspaceContext {
  productDescription?: string
  featureAreas?: string
  roadmapFocus?: string
  knownIssues?: string
  updatedAt?: string
}

export interface StoredAccount {
  id: string
  fileName: string
  analyzedAt: string
  updatedAt?: string
  result: AnalysisResult
  participantRoles: ParticipantRoles
  context: AccountContext
  shareToken: string
  supplementalContext?: string
  signalActions?: Record<string, SignalAction>
}

export type { SignalActionStatus, SignalAction } from "@/lib/signal-utils"
export { signalKey, buildSignalActionsBlock } from "@/lib/signal-utils"
import type { SignalAction } from "@/lib/signal-utils"

export async function saveSignalAction(
  uid: string,
  accountId: string,
  key: string,
  action: SignalAction
): Promise<void> {
  const ref = doc(accountsRef(uid), accountId)
  await updateDoc(ref, { [`signalActions.${key}`]: action })
}

export interface AggregatedSignal {
  problemStatement: string
  title: string
  type: string
  priority: string
  pmAction: string
  accountCount: number
  accountNames: string[]
  quotes: string[]
}

// ─── Refs ─────────────────────────────────────────────────────────────────────

function accountsRef(uid: string) {
  return collection(db, "users", uid, "accounts")
}

// ─── Account CRUD ─────────────────────────────────────────────────────────────

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
  // Mirror shareToken → sharedAccounts for lookup without uid
  await setDoc(doc(db, "sharedAccounts", data.shareToken), {
    uid,
    accountId: ref.id,
    accountName: data.result.accountName,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, ...data }
}

export async function updateAccount(
  uid: string,
  id: string,
  data: Partial<Omit<StoredAccount, "id">>
): Promise<void> {
  const ref = doc(accountsRef(uid), id)
  await setDoc(ref, { ...data, _updatedAt: serverTimestamp() }, { merge: true })
}

export async function getAccount(uid: string, id: string): Promise<StoredAccount | null> {
  const snap = await getDoc(doc(accountsRef(uid), id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as StoredAccount
}

export async function deleteAccount(uid: string, id: string): Promise<void> {
  const account = await getAccount(uid, id)
  if (account?.shareToken) {
    await deleteDoc(doc(db, "sharedAccounts", account.shareToken))
  }
  await deleteDoc(doc(accountsRef(uid), id))
}

// ─── Shared account lookup (no auth required) ─────────────────────────────────

export async function getSharedAccount(token: string): Promise<StoredAccount | null> {
  const snap = await getDoc(doc(db, "sharedAccounts", token))
  if (!snap.exists()) return null
  const { uid, accountId } = snap.data() as { uid: string; accountId: string }
  return getAccount(uid, accountId)
}

// ─── Cross-account signal aggregation ─────────────────────────────────────────

// ─── Participant helpers ───────────────────────────────────────────────────────

export function buildParticipantContext(roles: ParticipantRoles): {
  vendor: string[]
  customer: string[]
  partner: string[]
  other: string[]
} {
  const groups: { vendor: string[]; customer: string[]; partner: string[]; other: string[] } = { vendor: [], customer: [], partner: [], other: [] }
  for (const [name, role] of Object.entries(roles)) {
    groups[role].push(name)
  }
  return groups
}

// ─── Workspace context ────────────────────────────────────────────────────────
// Stored at users/{uid} document field `workspace: WorkspaceContext`

export async function getWorkspace(uid: string): Promise<WorkspaceContext> {
  const snap = await getDoc(doc(db, "users", uid))
  if (!snap.exists()) return {}
  return (snap.data().workspace as WorkspaceContext) ?? {}
}

export async function saveWorkspace(uid: string, ctx: WorkspaceContext): Promise<void> {
  await setDoc(doc(db, "users", uid), { workspace: { ...ctx, updatedAt: new Date().toISOString() } }, { merge: true })
}

// ─── Contact book ─────────────────────────────────────────────────────────────
// Stored at users/{uid} document field `contactBook: Record<string, ParticipantRole>`
// Keys are exact participant name strings as they appear in WhatsApp exports.

export async function getContactBook(uid: string): Promise<ParticipantRoles> {
  const snap = await getDoc(doc(db, "users", uid))
  if (!snap.exists()) return {}
  return (snap.data().contactBook as ParticipantRoles) ?? {}
}

// Merges roles into the contact book — only adds/overwrites non-"other" roles
// so that explicit labels are never silently downgraded back to "other".
export async function mergeContactBook(uid: string, roles: ParticipantRoles): Promise<void> {
  const existing = await getContactBook(uid)
  const merged: ParticipantRoles = { ...existing }
  for (const [name, role] of Object.entries(roles)) {
    if (role !== "other" || !merged[name]) {
      merged[name] = role
    }
  }
  await setDoc(doc(db, "users", uid), { contactBook: merged }, { merge: true })
}

// Pre-fills known contacts into a fresh participant map, defaulting unknowns to "other"
export async function prefillFromContactBook(
  uid: string,
  participants: string[]
): Promise<ParticipantRoles> {
  const book = await getContactBook(uid)
  const roles: ParticipantRoles = {}
  for (const name of participants) {
    roles[name] = book[name] ?? "other"
  }
  return roles
}

export function aggregateSignals(accounts: StoredAccount[]): AggregatedSignal[] {
  const map = new Map<string, AggregatedSignal>()

  for (const account of accounts) {
    const seen = new Set<string>()
    for (const sig of account.result.productSignals ?? []) {
      // Group by problemStatement if available, fall back to normalised title
      const key = (sig.problemStatement ?? sig.title).toLowerCase().trim()
      if (seen.has(key)) continue
      seen.add(key)

      if (map.has(key)) {
        const existing = map.get(key)!
        existing.accountCount++
        existing.accountNames.push(account.result.accountName)
        if (sig.quote) existing.quotes.push(sig.quote)
      } else {
        map.set(key, {
          problemStatement: sig.problemStatement ?? sig.title,
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
