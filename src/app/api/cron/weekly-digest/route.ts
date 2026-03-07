import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/infrastructure/firebase/firebase-server"

export const maxDuration = 60

// Vercel cron — fires every Monday 8am UTC
// Sends weekly digest to every user who has a notificationEmail set
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const adminDb = getAdminDb()
    const usersSnap = await adminDb.collection("users").get()

    let sent = 0
    let skipped = 0

    for (const userDoc of usersSnap.docs) {
      const workspace = userDoc.data()?.workspace
      const email = workspace?.notificationEmail
      if (!email) { skipped++; continue }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nectic.vercel.app"
      await fetch(`${baseUrl}/api/concept/weekly-digest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userDoc.id, email }),
      })
      sent++
    }

    return NextResponse.json({ sent, skipped })
  } catch (err) {
    console.error("Cron weekly digest error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}
