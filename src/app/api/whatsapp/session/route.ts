/**
 * POST /api/whatsapp/session
 * Tells the bridge to start a WhatsApp session for this user.
 * Auth: Firebase ID token in Authorization header.
 */
import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"
import { getWorkspace } from "@/lib/concept-firestore"

const BRIDGE_URL = process.env.WHATSAPP_BRIDGE_URL ?? ""
const BRIDGE_SECRET = process.env.WHATSAPP_BRIDGE_SECRET ?? ""

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let uid: string
    try {
      const decoded = await adminAuth.verifyIdToken(token)
      uid = decoded.uid
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!BRIDGE_URL) {
      return NextResponse.json({ error: "WhatsApp bridge not configured" }, { status: 503 })
    }

    // Get or create webhook token for this user
    const workspace = await getWorkspace(uid)
    const webhookToken = workspace.webhookToken
    if (!webhookToken) {
      return NextResponse.json({ error: "Save workspace settings first to generate a webhook token" }, { status: 400 })
    }

    const res = await fetch(`${BRIDGE_URL}/session/${uid}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bridge-Secret": BRIDGE_SECRET,
      },
      body: JSON.stringify({ webhookToken }),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.error ?? "Bridge error" }, { status: 502 })

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let uid: string
    try {
      const decoded = await adminAuth.verifyIdToken(token)
      uid = decoded.uid
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!BRIDGE_URL) return NextResponse.json({ error: "Bridge not configured" }, { status: 503 })

    const res = await fetch(`${BRIDGE_URL}/session/${uid}`, {
      method: "DELETE",
      headers: { "X-Bridge-Secret": BRIDGE_SECRET },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.ok ? 200 : 502 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
