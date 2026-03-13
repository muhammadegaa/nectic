/**
 * POST /api/whatsapp/webhook?token=<webhookToken>
 *
 * Receives messages forwarded from the Baileys bridge.
 * The bridge formats payloads in WATI webhook shape — same structure,
 * so we can use the same buffering + analysis pipeline.
 */
import { NextRequest, NextResponse } from "next/server"
import { getUidFromWebhookToken, appendToWatiBuffer, type WatiBufferMessage } from "@/lib/concept-firestore"

export const maxDuration = 10

// Payload shape the Baileys bridge sends (mirrors WATI webhook format)
interface BridgeWebhookPayload {
  id?: string
  eventType?: string   // always "message" from bridge
  type?: string        // always "text" from bridge
  text?: string
  owner?: boolean      // always false from bridge (customer messages only)
  waId?: string        // group JID (e.g. "120363xxxx@g.us") or phone
  senderName?: string
  timestamp?: string
}

export async function POST(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 })
    }

    const uid = await getUidFromWebhookToken(token)
    if (!uid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const payload = await req.json() as BridgeWebhookPayload

    if (payload.eventType !== "message") {
      return NextResponse.json({ ok: true, skipped: "non-message event" })
    }
    if (payload.owner === true) {
      return NextResponse.json({ ok: true, skipped: "outgoing message" })
    }
    if (payload.type !== "text" || !payload.text?.trim()) {
      return NextResponse.json({ ok: true, skipped: "non-text message" })
    }

    const waId = payload.waId
    if (!waId) {
      return NextResponse.json({ error: "No waId in payload" }, { status: 400 })
    }

    const contactName = payload.senderName ?? waId
    const messageId = payload.id ?? `${waId}-${Date.now()}`
    const timestamp = payload.timestamp ?? new Date().toISOString()

    const message: WatiBufferMessage = {
      id: messageId,
      text: payload.text.trim(),
      senderName: contactName,
      isCustomer: true,
      timestamp,
    }

    const { messageCount, needsAnalysis } = await appendToWatiBuffer(uid, waId, message, contactName)

    if (needsAnalysis) {
      const flushUrl = new URL(req.url)
      flushUrl.pathname = "/api/cron/flush-wati-buffers"
      fetch(flushUrl.toString(), {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, buffered: messageCount, needsAnalysis })
  } catch (err: unknown) {
    console.error("WhatsApp bridge webhook error:", err)
    return NextResponse.json({ ok: true, error: String(err) })
  }
}
