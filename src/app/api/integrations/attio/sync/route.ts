import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUserId } from "@/lib/auth-server"
import { getAdminDb } from "@/infrastructure/firebase/firebase-server"
import { findAttioCompany, writeSignalToAttio, type AttioTokens } from "@/lib/attio"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"

export const maxDuration = 30

interface SyncRequest {
  accountName: string
  riskLevel: string
  result: AnalysisResult
  arrAtRisk: number
}

export async function POST(req: NextRequest) {
  const uid = await getAuthenticatedUserId(req)
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { accountName, riskLevel, result, arrAtRisk } = await req.json() as SyncRequest
  if (!accountName || !result) {
    return NextResponse.json({ error: "accountName and result required" }, { status: 400 })
  }

  const adminDb = getAdminDb()
  const userDoc = await adminDb.collection("users").doc(uid).get()
  const data = userDoc.data()

  const integration = data?.attioIntegration as AttioTokens | undefined
  if (!integration?.accessToken) return NextResponse.json({ skipped: "attio_not_connected" })

  const companyId = await findAttioCompany(integration.accessToken, accountName)
  if (!companyId) return NextResponse.json({ skipped: "company_not_found", accountName })

  const topSignal = result.riskSignals?.[0]
  const signalSummary = topSignal
    ? `[${riskLevel.toUpperCase()}] ${(topSignal as { title?: string }).title ?? topSignal.explanation?.slice(0, 100) ?? "Risk signal detected"}`
    : `[${riskLevel.toUpperCase()}] Risk signals detected in WhatsApp conversation`

  const synced = await writeSignalToAttio(integration.accessToken, companyId, {
    riskLevel,
    signalSummary,
    arrAtRisk,
    healthScore: result.healthScore ?? 5,
  })

  if (!synced) return NextResponse.json({ error: "attio_write_failed" }, { status: 502 })
  return NextResponse.json({ ok: true, companyId, accountName })
}
