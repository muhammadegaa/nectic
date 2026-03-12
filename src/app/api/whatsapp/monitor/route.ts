/**
 * POST /api/whatsapp/monitor
 * Sets which groups to monitor for this user.
 * Body: { groupJids: string[] }
 */
import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

const BRIDGE_URL = process.env.WA_BRIDGE_URL ?? process.env.WHATSAPP_BRIDGE_URL ?? ""
const BRIDGE_SECRET = process.env.WA_BRIDGE_SECRET ?? process.env.WHATSAPP_BRIDGE_SECRET ?? ""

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

    if (!BRIDGE_URL) return NextResponse.json({ error: "Bridge not configured" }, { status: 503 })

    const { groupJids } = await req.json() as { groupJids?: string[] }
    if (!Array.isArray(groupJids)) {
      return NextResponse.json({ error: "groupJids required" }, { status: 400 })
    }

    const res = await fetch(`${BRIDGE_URL}/session/${uid}/monitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bridge-Secret": BRIDGE_SECRET,
      },
      body: JSON.stringify({ groupJids }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.ok ? 200 : 502 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
