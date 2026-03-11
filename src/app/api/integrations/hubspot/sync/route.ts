import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUserId } from "@/lib/auth-server"
import { getAdminDb } from "@/infrastructure/firebase/firebase-server"
import {
  refreshHubSpotToken,
  findHubSpotCompany,
  writeSignalToHubSpot,
  type HubSpotTokens,
} from "@/lib/hubspot"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"

export const maxDuration = 30

interface SyncRequest {
  accountName: string
  riskLevel: string
  result: AnalysisResult
  arrAtRisk: number
}

// POST /api/integrations/hubspot/sync
// Called after analysis completes for critical/high accounts.
// Finds the matching HubSpot company and writes signal properties.
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

  const integration = data?.hubspotIntegration as HubSpotTokens & { connectedAt?: string } | undefined
  if (!integration?.accessToken) {
    return NextResponse.json({ skipped: "hubspot_not_connected" })
  }

  // Refresh token if expired (or within 5 min of expiry)
  let accessToken = integration.accessToken
  if (integration.expiresAt < Date.now() + 5 * 60 * 1000) {
    try {
      const refreshed = await refreshHubSpotToken(integration.refreshToken)
      accessToken = refreshed.access_token
      await adminDb.collection("users").doc(uid).set(
        {
          hubspotIntegration: {
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
            expiresAt: Date.now() + refreshed.expires_in * 1000,
          },
        },
        { merge: true }
      )
    } catch (e) {
      console.error("HubSpot token refresh failed:", e)
      return NextResponse.json({ error: "token_refresh_failed" }, { status: 502 })
    }
  }

  // Find matching HubSpot company
  const companyId = await findHubSpotCompany(accessToken, accountName)
  if (!companyId) {
    return NextResponse.json({ skipped: "company_not_found", accountName })
  }

  // Build signal summary from top risk signal
  const topSignal = result.riskSignals?.[0]
  const signalSummary = topSignal
    ? `[${riskLevel.toUpperCase()}] ${(topSignal as { title?: string }).title ?? topSignal.explanation?.slice(0, 100) ?? "Risk signal detected"}`
    : `[${riskLevel.toUpperCase()}] Risk signals detected in WhatsApp conversation`

  const synced = await writeSignalToHubSpot(accessToken, companyId, {
    riskLevel,
    signalSummary,
    arrAtRisk,
    healthScore: result.healthScore ?? 5,
  })

  if (!synced) {
    return NextResponse.json({ error: "hubspot_write_failed" }, { status: 502 })
  }

  return NextResponse.json({ ok: true, companyId, accountName })
}
