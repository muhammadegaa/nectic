import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/infrastructure/firebase/firebase-server"
import type { WatiBuffer, WatiBufferMessage, WorkspaceContext, AccountContext, ParticipantRoles } from "@/lib/concept-firestore"
import { findHubSpotCompany, writeSignalToHubSpot, refreshHubSpotToken, type HubSpotTokens } from "@/lib/hubspot"
import { findAttioCompany, writeSignalToAttio, type AttioTokens } from "@/lib/attio"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"

export const maxDuration = 60

// Flush threshold: buffers idle for 4h with at least 5 messages get analysed automatically
const IDLE_THRESHOLD_MS = 4 * 60 * 60 * 1000
const MIN_MESSAGES = 5

// Format buffered messages into a WhatsApp-export-style conversation string
function formatBuffer(buffer: WatiBuffer): string {
  return buffer.messages
    .map((msg: WatiBufferMessage) => {
      const d = new Date(msg.timestamp)
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`
      return `${dateStr} - ${msg.senderName}: ${msg.text}`
    })
    .join("\n")
}

// Build participant roles: all customer messages = customer, our messages = vendor
function buildRoles(buffer: WatiBuffer): ParticipantRoles {
  const roles: ParticipantRoles = {}
  for (const msg of buffer.messages) {
    if (!roles[msg.senderName]) {
      roles[msg.senderName] = msg.isCustomer ? "customer" : "vendor"
    }
  }
  return roles
}

// Server-side CRM sync — called after WATI auto-analysis.
// Reads tokens from Firestore directly (no client auth available in cron context).
async function syncCrmServer(
  adminDb: ReturnType<typeof getAdminDb>,
  uid: string,
  userData: Record<string, unknown>,
  result: AnalysisResult,
  arrAtRisk: number
): Promise<void> {
  const riskLevel = result.riskLevel
  if (riskLevel !== "critical" && riskLevel !== "high") return

  const topSignal = result.riskSignals?.[0]
  const signalSummary = topSignal
    ? `[${riskLevel.toUpperCase()}] ${(topSignal as { title?: string }).title ?? topSignal.explanation?.slice(0, 100) ?? "Risk signal"}`
    : `[${riskLevel.toUpperCase()}] Risk signals detected via WhatsApp`

  const payload = { riskLevel, signalSummary, arrAtRisk, healthScore: result.healthScore ?? 5 }
  const accountName = result.accountName ?? ""

  // HubSpot
  const hs = userData.hubspotIntegration as (HubSpotTokens & { connectedAt?: string }) | undefined
  if (hs?.accessToken && accountName) {
    let accessToken = hs.accessToken
    if (hs.expiresAt < Date.now() + 5 * 60 * 1000) {
      try {
        const refreshed = await refreshHubSpotToken(hs.refreshToken)
        accessToken = refreshed.access_token
        await adminDb.collection("users").doc(uid).set(
          { hubspotIntegration: { accessToken: refreshed.access_token, refreshToken: refreshed.refresh_token, expiresAt: Date.now() + refreshed.expires_in * 1000 } },
          { merge: true }
        )
      } catch { /* non-fatal */ }
    }
    try {
      const companyId = await findHubSpotCompany(accessToken, accountName)
      if (companyId) await writeSignalToHubSpot(accessToken, companyId, payload)
    } catch { /* non-fatal */ }
  }

  // Attio
  const at = userData.attioIntegration as AttioTokens | undefined
  if (at?.accessToken && accountName) {
    try {
      const companyId = await findAttioCompany(at.accessToken, accountName)
      if (companyId) await writeSignalToAttio(at.accessToken, companyId, payload)
    } catch { /* non-fatal */ }
  }
}

// Vercel cron — fires every 30 min
// For each user: find WATI buffers that are idle >= 4h or flagged needsAnalysis
// Format as conversation → POST to analyze → save result → clear buffer
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nectic.vercel.app"
  const adminDb = getAdminDb()
  const now = Date.now()

  let analysed = 0
  let skipped = 0
  let usersChecked = 0

  try {
    const usersSnap = await adminDb.collection("users").get()

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id
      const userData = userDoc.data()
      const workspace = userData.workspace as WorkspaceContext | undefined
      if (!workspace) continue

      usersChecked++

      // Get all watiBuffer subcollection docs for this user
      const buffersSnap = await adminDb.collection("users").doc(uid).collection("watiBuffer").get()
      if (buffersSnap.empty) continue

      for (const bufferDoc of buffersSnap.docs) {
        const buffer = bufferDoc.data() as WatiBuffer

        // Skip if already triggered recently (avoid double-analysis)
        if (buffer.analysisTriggeredAt) {
          const triggeredAgo = now - new Date(buffer.analysisTriggeredAt).getTime()
          if (triggeredAgo < IDLE_THRESHOLD_MS) {
            skipped++
            continue
          }
        }

        const idleMs = now - new Date(buffer.lastMessageAt).getTime()
        const shouldFlush = buffer.needsAnalysis || (idleMs >= IDLE_THRESHOLD_MS && buffer.messages.length >= MIN_MESSAGES)

        if (!shouldFlush) {
          skipped++
          continue
        }

        try {
          const conversation = formatBuffer(buffer)
          const participantRoles = buildRoles(buffer)

          // Try to match to existing account by watiPhone
          const accountsSnap = await adminDb.collection("users").doc(uid).collection("accounts").get()
          const matchedAccount = accountsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .find((a: Record<string, unknown>) => (a.context as AccountContext)?.watiPhone === buffer.waId)

          // Mark as triggered before firing (prevent race)
          await adminDb.collection("users").doc(uid).collection("watiBuffer").doc(buffer.waId).update({
            analysisTriggeredAt: new Date().toISOString(),
            needsAnalysis: false,
          })

          const analyzeUrl = matchedAccount
            ? `${baseUrl}/api/concept/reanalyze`
            : `${baseUrl}/api/concept/analyze`

          const body = matchedAccount
            ? {
                priorAnalysis: (matchedAccount as Record<string, unknown>).result,
                conversation,
                messageCount: buffer.messages.length,
                participantRoles,
                signalActions: (matchedAccount as Record<string, unknown>).signalActions ?? null,
                workspace,
              }
            : {
                conversation,
                messageCount: buffer.messages.length,
                participantRoles,
                context: { watiPhone: buffer.waId } as AccountContext,
                workspace,
              }

          const res = await fetch(analyzeUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })

          if (!res.ok) {
            console.error(`flush-wati-buffers: analysis failed for ${buffer.waId} (uid=${uid}): ${res.status}`)
            continue
          }

          const data = await res.json() as { result?: AnalysisResult }
          if (!data.result) continue

          // CRM sync — server-side, fire-and-forget
          const arrAtRisk = (() => {
            const tier = (matchedAccount as Record<string, unknown> | undefined)?.context as AccountContext | undefined
            if (tier?.annualValue) return tier.annualValue
            const t = tier?.contractTier
            return t === "enterprise" ? 24000 : t === "growth" ? 9600 : 3600
          })()
          syncCrmServer(adminDb, uid, userData, data.result, arrAtRisk).catch(() => {})

          const shareToken = crypto.randomUUID()
          const now_iso = new Date().toISOString()

          if (matchedAccount) {
            // Update existing account
            await adminDb.collection("users").doc(uid).collection("accounts").doc(matchedAccount.id as string).set(
              {
                result: data.result,
                fileName: `wati-live-${now_iso.slice(0, 10)}`,
                updatedAt: now_iso,
                participantRoles,
                ...(workspace.version !== undefined && { workspaceVersion: workspace.version }),
              },
              { merge: true }
            )
          } else {
            // Create new account
            await adminDb.collection("users").doc(uid).collection("accounts").add({
              fileName: `wati-live-${now_iso.slice(0, 10)}`,
              analyzedAt: now_iso,
              result: data.result,
              participantRoles,
              context: { watiPhone: buffer.waId },
              shareToken,
              healthHistory: [{ score: (data.result as unknown as Record<string, unknown>).healthScore ?? 5, date: now_iso }],
              analysisHistory: [data.result],
              ...(workspace.version !== undefined && { workspaceVersion: workspace.version }),
            })
          }

          // Clear the buffer after successful analysis
          await adminDb.collection("users").doc(uid).collection("watiBuffer").doc(buffer.waId).delete()

          analysed++
        } catch (err) {
          console.error(`flush-wati-buffers: error processing ${buffer.waId}:`, err)
        }
      }
    }

    return NextResponse.json({ ok: true, usersChecked, analysed, skipped })
  } catch (err) {
    console.error("flush-wati-buffers error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
