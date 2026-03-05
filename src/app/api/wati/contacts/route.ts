import { NextRequest, NextResponse } from "next/server"
import { watiGetContacts } from "@/lib/wati-client"

export async function POST(req: NextRequest) {
  try {
    const { endpoint, token, pageSize = 100, pageNumber = 1 } = await req.json() as {
      endpoint: string
      token: string
      pageSize?: number
      pageNumber?: number
    }

    if (!endpoint || !token) {
      return NextResponse.json({ error: "endpoint and token are required" }, { status: 400 })
    }

    const result = await watiGetContacts(endpoint, token, pageSize, pageNumber)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("WATI contacts error:", message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
