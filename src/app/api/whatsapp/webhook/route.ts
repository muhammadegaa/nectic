import { NextRequest, NextResponse } from "next/server"

// WhatsApp Business API webhook verification
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

// WhatsApp Business API webhook — receives messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // TODO: Process incoming WhatsApp messages
    // 1. Extract message content and sender
    // 2. Store in Firestore
    // 3. Trigger insight extraction pipeline

    console.log("WhatsApp webhook received:", JSON.stringify(body, null, 2))

    return NextResponse.json({ status: "received" }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}
