import { NextRequest, NextResponse } from "next/server"

const BRIDGE_URL = process.env.WA_BRIDGE_URL
const BRIDGE_SECRET = process.env.WA_BRIDGE_SECRET

function bridgeHeaders(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" }
  if (BRIDGE_SECRET) h["x-bridge-secret"] = BRIDGE_SECRET
  return h
}

async function proxyRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<NextResponse> {
  if (!BRIDGE_URL) {
    return NextResponse.json({ error: "WA bridge not configured (WA_BRIDGE_URL missing)" }, { status: 503 })
  }

  try {
    const url = `${BRIDGE_URL.replace(/\/$/, "")}${path}`
    const res = await fetch(url, {
      method,
      headers: bridgeHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bridge connection failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

// ─── Session start ────────────────────────────────────────────────────────────
// POST /api/wa-bridge { action: "start", uid }
// POST /api/wa-bridge { action: "status", uid }
// POST /api/wa-bridge { action: "contacts", uid }
// POST /api/wa-bridge { action: "messages", uid, waid, limit? }
// POST /api/wa-bridge { action: "logout", uid }

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    action: "start" | "status" | "contacts" | "messages" | "logout"
    uid: string
    waid?: string
    limit?: number
  }

  const { action, uid } = body
  if (!uid) return NextResponse.json({ error: "uid is required" }, { status: 400 })

  switch (action) {
    case "start":
      return proxyRequest("POST", "/session/start", { uid })

    case "status":
      return proxyRequest("GET", `/session/status?uid=${encodeURIComponent(uid)}`)

    case "contacts":
      return proxyRequest("GET", `/contacts?uid=${encodeURIComponent(uid)}`)

    case "messages": {
      const { waid, limit = 200 } = body
      if (!waid) return NextResponse.json({ error: "waid is required" }, { status: 400 })
      return proxyRequest("GET", `/messages/${encodeURIComponent(waid)}?uid=${encodeURIComponent(uid)}&limit=${limit}`)
    }

    case "logout":
      return proxyRequest("DELETE", `/session?uid=${encodeURIComponent(uid)}`)

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  }
}
