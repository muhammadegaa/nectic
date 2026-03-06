import { NextRequest, NextResponse } from "next/server"
import { watiGetMessages, formatWatiMessagesForAnalysis } from "@/lib/wati-client"

export async function POST(req: NextRequest) {
  try {
    const { endpoint, token, phoneNumber, contactName, pageSize = 200 } = await req.json() as {
      endpoint: string
      token: string
      phoneNumber: string
      contactName: string
      pageSize?: number
    }

    if (!endpoint || !token || !phoneNumber) {
      return NextResponse.json({ error: "endpoint, token, and phoneNumber are required" }, { status: 400 })
    }

    const { messages, totalCount } = await watiGetMessages(endpoint, token, phoneNumber, pageSize)

    if (messages.length === 0) {
      return NextResponse.json({
        error: "No messages found for this contact. This contact may not have any conversations through your WATI account — if the chats happened on regular WhatsApp, use the file export path instead."
      }, { status: 404 })
    }

    const { conversation, participantRoles } = formatWatiMessagesForAnalysis(
      messages,
      contactName || phoneNumber
    )

    return NextResponse.json({
      conversation,
      participantRoles,
      messageCount: messages.length,
      totalCount,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("WATI messages error:", message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
