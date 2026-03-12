/**
 * POST /api/whatsapp/send
 * Sends a message via the active Baileys session.
 * Body: { jid: string, text: string }
 *
 * jid can be:
 *  - Group JID:   "120363xxxxxx@g.us"   (Baileys-ingested group chats)
 *  - Contact JID: "628xxxx@s.whatsapp.net" (normalised from phone number)
 */
import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

const BRIDGE_URL = process.env.WA_BRIDGE_URL ?? process.env.WHATSAPP_BRIDGE_URL ?? ""
const BRIDGE_SECRET = process.env.WA_BRIDGE_SECRET ?? process.env.WHATSAPP_BRIDGE_SECRET ?? ""

/** Normalise a bare phone number to a WhatsApp JID */
function toJid(raw: string): string {
  if (raw.includes("@")) return raw   // already a JID
  const digits = raw.replace(/\D/g, "")
  return `${digits}@s.whatsapp.net`
}

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

    const { jid, text } = await req.json() as { jid?: string; text?: string }
    if (!jid || !text?.trim()) {
      return NextResponse.json({ error: "jid and text required" }, { status: 400 })
    }

    const res = await fetch(`${BRIDGE_URL}/session/${uid}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bridge-Secret": BRIDGE_SECRET,
      },
      body: JSON.stringify({ jid: toJid(jid), text: text.trim() }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.ok ? 200 : 502 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
