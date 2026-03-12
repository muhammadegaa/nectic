/**
 * GET /api/whatsapp/status
 * Polled by the frontend every 2s while QR modal is open.
 */
import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/infrastructure/firebase/firebase-server"

const BRIDGE_URL = process.env.WA_BRIDGE_URL ?? process.env.WHATSAPP_BRIDGE_URL ?? ""
const BRIDGE_SECRET = process.env.WA_BRIDGE_SECRET ?? process.env.WHATSAPP_BRIDGE_SECRET ?? ""

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let uid: string
    try {
      const decoded = await getAdminAuth().verifyIdToken(token)
      uid = decoded.uid
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!BRIDGE_URL) return NextResponse.json({ status: "none" })

    const res = await fetch(`${BRIDGE_URL}/session/${uid}/status`, {
      headers: { "X-Bridge-Secret": BRIDGE_SECRET },
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
