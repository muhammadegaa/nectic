import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/infrastructure/firebase/firebase-server"
import type { StoredAccount } from "@/lib/concept-firestore"

export const maxDuration = 60

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

// Vercel cron — fires every day at 9am UTC
// For each user:
//   1. critical/high accounts with unactioned signals for >3 days → re-alert
//   2. accounts with no analysis for >7 days → staleness nudge
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nectic.vercel.app"
  const adminDb = getAdminDb()

  let alertsSent = 0
  let nudgesSent = 0
  let usersChecked = 0

  try {
    const usersSnap = await adminDb.collection("users").get()

    for (const userDoc of usersSnap.docs) {
      const workspace = userDoc.data()?.workspace
      const email = workspace?.notificationEmail
      if (!email) continue

      usersChecked++

      const accountsSnap = await adminDb
        .collection("users")
        .doc(userDoc.id)
        .collection("accounts")
        .get()

      const accounts = accountsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as StoredAccount[]

      const now = Date.now()

      let userAlerts = 0
      let userNudges = 0
      const events: { type: "alert" | "nudge" | "healthy"; accountName: string; detail: string }[] = []
      let healthyCount = 0

      for (const account of accounts) {
        const riskLevel = account.result?.riskLevel
        const accountName = account.result?.accountName
        const lastUpdated = new Date(account.updatedAt ?? account.analyzedAt).getTime()
        const ageMs = now - lastUpdated

        // Check 1: stale analysis (>7 days, any risk level)
        if (ageMs > SEVEN_DAYS_MS) {
          const daysSinceAnalysis = Math.floor(ageMs / (24 * 60 * 60 * 1000))
          await fetch(`${baseUrl}/api/concept/notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accountName,
              accountId: account.id,
              riskLevel: riskLevel ?? "medium",
              signalCount: 0,
              email,
              isStaleNudge: true,
              daysSinceAnalysis,
            }),
          }).catch(() => {})
          nudgesSent++
          userNudges++
          if (events.length < 10) {
            events.push({ type: "nudge", accountName, detail: `${daysSinceAnalysis} days since last analysis — nudge sent` })
          }
          continue
        }

        // Check 2: critical/high with unactioned signals for >3 days
        if (riskLevel !== "critical" && riskLevel !== "high") {
          if (healthyCount < 3 && events.length < 10) {
            events.push({ type: "healthy", accountName, detail: "No action needed" })
            healthyCount++
          }
          continue
        }
        if (ageMs < THREE_DAYS_MS) {
          if (healthyCount < 3 && events.length < 10) {
            events.push({ type: "healthy", accountName, detail: "No action needed" })
            healthyCount++
          }
          continue
        }

        const riskSignals = account.result?.riskSignals ?? []
        const signalActions = account.signalActions ?? {}

        // Find the top unactioned risk signal
        const unactioned = riskSignals.find((s) => {
          const sType = (s as { type?: string }).type ?? "risk"
          const sTitle = s.explanation?.slice(0, 80) ?? ""
          const key = `${sType}-${sTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`
          const action = signalActions[key]
          return !action || (action.status !== "done" && action.status !== "dismissed")
        })

        if (!unactioned) {
          if (healthyCount < 3 && events.length < 10) {
            events.push({ type: "healthy", accountName, detail: "No action needed" })
            healthyCount++
          }
          continue
        }

        // Re-send alert for persistently unactioned signal
        await fetch(`${baseUrl}/api/concept/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountName,
            accountId: account.id,
            riskLevel,
            signalCount: riskSignals.length,
            topSignalTitle: (unactioned as { title?: string }).title ?? unactioned.explanation?.slice(0, 80),
            topSignalQuote: unactioned.quote,
            topSignalExplanation: unactioned.explanation,
            email,
            isReAlert: true,
            daysSinceAnalysis: Math.floor(ageMs / (24 * 60 * 60 * 1000)),
          }),
        }).catch(() => {})
        alertsSent++
        userAlerts++
        if (events.length < 10) {
          events.push({ type: "alert", accountName, detail: `Unactioned ${riskLevel} signal — re-alert sent` })
        }
      }

      // Write agent run results for this user
      await adminDb.collection("users").doc(userDoc.id).set(
        { lastAgentRun: { runAt: new Date().toISOString(), accountsScanned: accounts.length, alertsSent: userAlerts, nudgesSent: userNudges, events } },
        { merge: true }
      )
    }

    return NextResponse.json({ usersChecked, alertsSent, nudgesSent })
  } catch (err) {
    console.error("Account health check cron error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
