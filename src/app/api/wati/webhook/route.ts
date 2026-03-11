import { NextRequest, NextResponse } from "next/server"
import { getUidFromWebhookToken, appendToWatiBuffer, type WatiBufferMessage } from "@/lib/concept-firestore"

export const maxDuration = 10  // fast — just buffer the message

// WATI webhook payload shape (standard WATI BSP format)
interface WatiWebhookPayload {
  id?: string
  created?: number
  timestamp?: string
  type?: string        // "text" | "image" | "document" | "audio" | etc.
  text?: string        // message content (text messages only)
  owner?: boolean      // true = our agent sent it, false = customer sent it
  eventType?: string   // "message" | "message_status" | "contact_update" | etc.
  waId?: string        // customer phone number (E.164 without +)
  senderName?: string
  messageContact?: {
    id?: string
    name?: string
    phone?: string
  }
  conversationId?: string
}

export async function POST(req: NextRequest) {
  try {
    // Token auth — passed as query param: /api/wati/webhook?token=xxx
    const token = req.nextUrl.searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 })
    }

    const uid = await getUidFromWebhookToken(token)
    if (!uid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const payload = await req.json() as WatiWebhookPayload

    // Only process incoming customer text messages
    if (payload.eventType !== "message") {
      return NextResponse.json({ ok: true, skipped: "non-message event" })
    }
    if (payload.owner === true) {
      return NextResponse.json({ ok: true, skipped: "outgoing message" })
    }
    if (payload.type !== "text" || !payload.text?.trim()) {
      return NextResponse.json({ ok: true, skipped: "non-text message" })
    }

    const waId = payload.waId ?? payload.messageContact?.phone
    if (!waId) {
      return NextResponse.json({ error: "No waId in payload" }, { status: 400 })
    }

    const contactName = payload.senderName ?? payload.messageContact?.name ?? waId
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

    return NextResponse.json({
      ok: true,
      buffered: messageCount,
      needsAnalysis,
    })
  } catch (err: unknown) {
    console.error("WATI webhook error:", err)
    // Always return 200 to WATI — never let webhook retries pile up
    return NextResponse.json({ ok: true, error: String(err) })
  }
}
