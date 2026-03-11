import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUserId } from "@/lib/auth-server"
import { getAdminDb } from "@/infrastructure/firebase/firebase-server"
import type { StoredAccount, AccountContext } from "@/lib/concept-firestore"

export const maxDuration = 30

function getArrAtRisk(context: AccountContext | undefined, riskLevel: string): number {
  if (context?.annualValue) {
    const multipliers: Record<string, number> = { critical: 0.8, high: 0.5, medium: 0.2, low: 0 }
    return Math.round(context.annualValue * (multipliers[riskLevel] ?? 0))
  }
  const tiers: Record<string, Record<string, number>> = {
    enterprise: { critical: 19200, high: 12000, medium: 4800, low: 0 },
    growth:     { critical: 7680,  high: 4800,  medium: 1920, low: 0 },
    starter:    { critical: 2880,  high: 1800,  medium: 720,  low: 0 },
  }
  const tier = context?.contractTier ?? "starter"
  return tiers[tier]?.[riskLevel] ?? 0
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function csvEscape(val: unknown): string {
  const str = String(val ?? "")
  return str.includes(",") || str.includes('"') || str.includes("\n")
    ? `"${str.replace(/"/g, '""')}"`
    : str
}

// GET /api/export/accounts
// Returns a CSV of all accounts with signal data.
// Used as the Google Sheets import source — paste CSV or use importdata().
export async function GET(req: NextRequest) {
  const uid = await getAuthenticatedUserId(req)
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const adminDb = getAdminDb()
  const snap = await adminDb.collection("users").doc(uid).collection("accounts").get()

  const rows: string[] = []

  const headers = [
    "Account Name",
    "Risk Level",
    "Health Score",
    "Top Signal",
    "ARR at Risk ($)",
    "Industry",
    "Contract Tier",
    "Annual Value ($)",
    "Renewal Month",
    "Last Analyzed",
    "Days Since Analysis",
    "Open Risk Signals",
    "Open Product Signals",
    "Resolved Signals",
    "Context Confidence",
  ]
  rows.push(headers.join(","))

  for (const doc of snap.docs) {
    const account = { id: doc.id, ...doc.data() } as StoredAccount
    const result = account.result
    if (!result) continue

    const topSignal = result.riskSignals?.[0]
    const topSignalText = topSignal
      ? ((topSignal as { title?: string }).title ?? topSignal.explanation?.slice(0, 100) ?? "")
      : ""

    const openRisk = (result.riskSignals?.length ?? 0)
    const openProduct = (result.productSignals?.length ?? 0)
    const resolvedCount = Object.values(account.signalActions ?? {}).filter(
      (a) => a.status === "done" || a.status === "dismissed"
    ).length

    const lastAnalyzed = account.analyzedAt ?? account.updatedAt ?? ""
    const daysSinceAnalysis = lastAnalyzed ? daysSince(lastAnalyzed) : ""
    const arrAtRisk = getArrAtRisk(account.context, result.riskLevel)

    const row = [
      result.accountName ?? "",
      result.riskLevel ?? "",
      result.healthScore ?? "",
      topSignalText,
      arrAtRisk,
      account.context?.industry ?? "",
      account.context?.contractTier ?? "",
      account.context?.annualValue ?? "",
      account.context?.renewalMonth ?? "",
      lastAnalyzed ? lastAnalyzed.slice(0, 10) : "",
      daysSinceAnalysis,
      openRisk,
      openProduct,
      resolvedCount,
      result.analysisQuality?.confidence ?? "",
    ].map(csvEscape)

    rows.push(row.join(","))
  }

  const csv = rows.join("\r\n")
  const filename = `nectic-accounts-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
