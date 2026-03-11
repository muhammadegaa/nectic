import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUserId } from "@/lib/auth-server"
import { getAdminDb } from "@/infrastructure/firebase/firebase-server"

export const maxDuration = 10

export async function POST(req: NextRequest) {
  const uid = await getAuthenticatedUserId(req)
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const adminDb = getAdminDb()
  await adminDb.collection("users").doc(uid).set(
    {
      hubspotIntegration: null,
      workspace: {
        hubspotConnected: false,
        hubspotPortalId: null,
      },
    },
    { merge: true }
  )

  return NextResponse.json({ ok: true })
}
