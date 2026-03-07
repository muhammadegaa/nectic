import { NextRequest, NextResponse } from "next/server"
import { watiSendMessage } from "@/lib/wati-client"

export async function POST(req: NextRequest) {
  try {
    const { endpoint, token, phoneNumber, message } = await req.json() as {
      endpoint: string
      token: string
      phoneNumber: string
      message: string
    }

    if (!endpoint || !token || !phoneNumber || !message) {
      return NextResponse.json(
        { error: "endpoint, token, phoneNumber, and message are required" },
        { status: 400 }
      )
    }

    if (message.length > 4096) {
      return NextResponse.json({ error: "Message exceeds 4096 character limit" }, { status: 400 })
    }

    const result = await watiSendMessage(endpoint, token, phoneNumber, message)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("WATI send error:", message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
