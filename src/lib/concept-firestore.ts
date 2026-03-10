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
  annualValue?: number  // real ARR in USD — if set, overrides tier-based estimate
  renewalMonth?: string // "YYYY-MM"
  watiPhone?: string    // phone number for WATI-imported accounts (enables send-back)
}

export interface WorkspaceContext {
  productDescription?: string
  featureAreas?: string
  roadmapFocus?: string
  knownIssues?: string
  updatedAt?: string
  productStory?: string  // one sentence: "We help X do Y" — injected into all drafts
  // CS voice & persona — makes drafts sound like YOUR team, not a generic AI
  csPersonaName?: string        // who is writing: "Reza", "Sarah CS", etc.
  communicationStyle?: "formal" | "warm" | "casual"  // how your team writes
  csEscalationProcess?: string  // what happens when a signal hits critical
  companyVoiceSamples?: string[] // extracted vendor-side messages from past conversations
  // WATI BSP integration
  watiEndpoint?: string
  watiToken?: string
  // Notifications
  notificationEmail?: string
  // Alert preferences
  alertThreshold?: "critical_only" | "high_and_critical" | "all"
  alertFrequency?: "realtime" | "daily" | "weekly" | "paused"
  alertTimezone?: string
  // Signal suppression — signal types the user has marked as "not relevant"
  suppressedSignalTypes?: string[]
}

export interface HealthHistoryEntry {
  score: number
  date: string // ISO string
}

export interface AgentRunEvent {
  type: "alert" | "nudge" | "healthy"
  accountName: string
  detail: string
}

export interface AgentRun {
  runAt: string // ISO
  accountsScanned: number
  alertsSent: number
  nudgesSent: number
  events: AgentRunEvent[]
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
  healthHistory?: HealthHistoryEntry[]
  lastAlertSentAt?: string // ISO string — written by /api/concept/notify on alert send
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
  await setDoc(ref, { signalActions: { [key]: action } }, { merge: true })
}

export async function recalculateHealthFromResolutions(
  uid: string,
  accountId: string
): Promise<number | null> {
  const account = await getAccount(uid, accountId)
  if (!account) return null

  const totalSignals =
    (account.result.riskSignals?.length ?? 0) +
    (account.result.productSignals?.length ?? 0)
  if (totalSignals === 0) return null

  const resolvedCount = Object.values(account.signalActions ?? {}).filter(
    (a) => a.status === "done"
  ).length

  const resolvedRatio = resolvedCount / totalSignals
  const originalScore = account.result.healthScore ?? 5
  const newScore = Math.min(10, Math.round((originalScore * 0.7 + 10 * resolvedRatio * 0.3) * 10) / 10)

  const ref = doc(accountsRef(uid), accountId)
  await updateDoc(ref, { "result.healthScore": newScore })
  return newScore
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
  const initialHistory: HealthHistoryEntry[] = [{
    score: data.result.healthScore ?? 5,
    date: data.analyzedAt,
  }]
  const withHistory = { ...data, healthHistory: initialHistory }
  await setDoc(ref, { ...withHistory, _createdAt: serverTimestamp() })
  // Mirror shareToken → sharedAccounts for lookup without uid
  await setDoc(doc(db, "sharedAccounts", data.shareToken), {
    uid,
    accountId: ref.id,
    accountName: data.result.accountName,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, ...withHistory }
}

export async function updateAccount(
  uid: string,
  id: string,
  data: Partial<Omit<StoredAccount, "id">>
): Promise<void> {
  const ref = doc(accountsRef(uid), id)
  // When result is being updated, append to healthHistory
  if (data.result?.healthScore !== undefined) {
    const existing = await getDoc(ref)
    const prev = existing.exists() ? (existing.data().healthHistory as HealthHistoryEntry[] | undefined) ?? [] : []
    const newEntry: HealthHistoryEntry = {
      score: data.result.healthScore,
      date: new Date().toISOString(),
    }
    // Avoid duplicate entries on same day
    const today = newEntry.date.slice(0, 10)
    const filtered = prev.filter((h) => h.date.slice(0, 10) !== today)
    const updatedHistory = [...filtered, newEntry].slice(-20) // keep last 20 data points
    await setDoc(ref, { ...data, healthHistory: updatedHistory, _updatedAt: serverTimestamp() }, { merge: true })
  } else {
    await setDoc(ref, { ...data, _updatedAt: serverTimestamp() }, { merge: true })
  }
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

export async function getAgentRun(uid: string): Promise<AgentRun | null> {
  const snap = await getDoc(doc(db, "users", uid))
  if (!snap.exists()) return null
  return (snap.data().lastAgentRun as AgentRun) ?? null
}

export async function saveWorkspace(uid: string, ctx: WorkspaceContext): Promise<void> {
  // Firestore rejects undefined values — strip them before writing
  const clean = Object.fromEntries(
    Object.entries({ ...ctx, updatedAt: new Date().toISOString() }).filter(([, v]) => v !== undefined)
  )
  await setDoc(doc(db, "users", uid), { workspace: clean }, { merge: true })
}

// ─── Onboarding state ─────────────────────────────────────────────────────────

export async function isOnboardingComplete(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", uid))
  if (!snap.exists()) return false
  return (snap.data().onboardingComplete as boolean) ?? false
}

export async function markOnboardingComplete(uid: string): Promise<void> {
  await setDoc(doc(db, "users", uid), { onboardingComplete: true }, { merge: true })
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
