/**
 * Attio CRM integration helpers — server-side only.
 *
 * What Nectic writes to Attio:
 *   nectic_risk_level       — "critical" | "high" | "medium" | "low"
 *   nectic_signal_summary   — top signal title (string)
 *   nectic_last_signal_date — ISO date string
 *   nectic_arr_at_risk      — number (USD)
 *   nectic_health_score     — number 0–10
 *
 * All written as custom attributes on the "companies" object.
 */

export interface AttioTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  workspaceId?: string
}

// ─── Token refresh ─────────────────────────────────────────────────────────

export async function refreshAttioToken(refreshToken: string): Promise<{
  access_token: string
  expires_in?: number
}> {
  const res = await fetch("https://app.attio.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ATTIO_CLIENT_ID!,
      client_secret: process.env.ATTIO_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`Attio token refresh failed: ${await res.text()}`)
  return res.json()
}

// ─── Attribute bootstrap ───────────────────────────────────────────────────

const NECTIC_ATTRIBUTES = [
  { api_slug: "nectic_risk_level", title: "Nectic risk level", type: "text" },
  { api_slug: "nectic_signal_summary", title: "Nectic signal summary", type: "text" },
  { api_slug: "nectic_last_signal_date", title: "Nectic last signal date", type: "date" },
  { api_slug: "nectic_arr_at_risk", title: "Nectic ARR at risk ($)", type: "number" },
  { api_slug: "nectic_health_score", title: "Nectic health score", type: "number" },
]

export async function ensureAttioAttributes(accessToken: string): Promise<void> {
  for (const attr of NECTIC_ATTRIBUTES) {
    // GET existing attributes first — create only if missing
    const check = await fetch(
      `https://api.attio.com/v2/objects/companies/attributes/${attr.api_slug}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (check.ok) continue // already exists

    await fetch("https://api.attio.com/v2/objects/companies/attributes", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        api_slug: attr.api_slug,
        title: attr.title,
        type: attr.type,
        is_required: false,
      }),
    })
    // ignore errors — idempotent best-effort
  }
}

// ─── Company lookup ────────────────────────────────────────────────────────

export async function findAttioCompany(
  accessToken: string,
  accountName: string
): Promise<string | null> {
  const res = await fetch("https://api.attio.com/v2/objects/companies/records/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      filter: {
        name: { $contains: accountName.split(" ")[0] },
      },
      limit: 5,
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const records: Array<{ id: { record_id: string }; values: { name?: Array<{ value: string }> } }> =
    data.data ?? []
  if (!records.length) return null

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
  const target = normalize(accountName)
  let best: string | null = null
  let bestScore = 0

  for (const r of records) {
    const name = r.values?.name?.[0]?.value ?? ""
    const candidate = normalize(name)
    let overlap = 0
    for (let i = 0; i < Math.min(candidate.length, target.length); i++) {
      if (candidate[i] === target[i]) overlap++
      else break
    }
    const score = overlap / Math.max(candidate.length, target.length)
    if (score > bestScore) {
      bestScore = score
      best = r.id.record_id
    }
  }
  return bestScore > 0.4 ? best : null
}

// ─── Attribute write ───────────────────────────────────────────────────────

export interface NecticSignalPayload {
  riskLevel: string
  signalSummary: string
  arrAtRisk: number
  healthScore: number
}

export async function writeSignalToAttio(
  accessToken: string,
  recordId: string,
  payload: NecticSignalPayload
): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0]
  const res = await fetch(`https://api.attio.com/v2/objects/companies/records/${recordId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        values: {
          nectic_risk_level: [{ value: payload.riskLevel }],
          nectic_signal_summary: [{ value: payload.signalSummary.slice(0, 500) }],
          nectic_last_signal_date: [{ value: today }],
          nectic_arr_at_risk: [{ value: payload.arrAtRisk }],
          nectic_health_score: [{ value: payload.healthScore }],
        },
      },
    }),
  })
  return res.ok
}
