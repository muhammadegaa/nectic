/**
 * HubSpot integration helpers — server-side only.
 * Used by /api/integrations/hubspot/* routes.
 *
 * What Nectic writes to HubSpot:
 *   nectic_risk_level       — "critical" | "high" | "medium" | "low"
 *   nectic_signal_summary   — top signal title + explanation (plain text)
 *   nectic_last_signal_date — ISO date of last detected signal
 *   nectic_arr_at_risk      — estimated ARR at risk (number, USD)
 *   nectic_health_score     — 0–10 Nectic health score
 *
 * All written to the HubSpot `companies` object.
 */

export interface HubSpotTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number // unix ms
  portalId: string
}

// ─── Token refresh ─────────────────────────────────────────────────────────

export async function refreshHubSpotToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HubSpot token refresh failed: ${body}`)
  }
  return res.json()
}

// ─── Property bootstrap ────────────────────────────────────────────────────

const NECTIC_PROPERTIES = [
  {
    name: "nectic_risk_level",
    label: "Nectic risk level",
    type: "enumeration",
    fieldType: "select",
    options: [
      { label: "Critical", value: "critical", displayOrder: 0, hidden: false },
      { label: "High", value: "high", displayOrder: 1, hidden: false },
      { label: "Medium", value: "medium", displayOrder: 2, hidden: false },
      { label: "Low", value: "low", displayOrder: 3, hidden: false },
    ],
  },
  {
    name: "nectic_signal_summary",
    label: "Nectic signal summary",
    type: "string",
    fieldType: "textarea",
    options: [],
  },
  {
    name: "nectic_last_signal_date",
    label: "Nectic last signal date",
    type: "date",
    fieldType: "date",
    options: [],
  },
  {
    name: "nectic_arr_at_risk",
    label: "Nectic ARR at risk ($)",
    type: "number",
    fieldType: "number",
    options: [],
  },
  {
    name: "nectic_health_score",
    label: "Nectic health score",
    type: "number",
    fieldType: "number",
    options: [],
  },
]

export async function ensureNecticProperties(accessToken: string): Promise<void> {
  for (const prop of NECTIC_PROPERTIES) {
    // Try to create — HubSpot returns 409 if it exists, which we ignore
    await fetch("https://api.hubapi.com/crm/v3/properties/companies", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: prop.name,
        label: prop.label,
        type: prop.type,
        fieldType: prop.fieldType,
        groupName: "companyinformation",
        options: prop.options,
      }),
    })
    // 409 = already exists — fine. Any other error we swallow for resilience.
  }
}

// ─── Company lookup ────────────────────────────────────────────────────────

export async function findHubSpotCompany(
  accessToken: string,
  accountName: string
): Promise<string | null> {
  const res = await fetch(
    "https://api.hubapi.com/crm/v3/objects/companies/search",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "name",
                operator: "CONTAINS_TOKEN",
                value: accountName.split(" ")[0], // first word for fuzzy match
              },
            ],
          },
        ],
        properties: ["name", "hs_object_id"],
        limit: 5,
      }),
    }
  )
  if (!res.ok) return null
  const data = await res.json()
  const results: Array<{ id: string; properties: { name: string } }> = data.results ?? []
  if (!results.length) return null

  // Best match: highest character overlap with accountName
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
  const target = normalize(accountName)
  let best: string | null = null
  let bestScore = 0
  for (const r of results) {
    const candidate = normalize(r.properties.name ?? "")
    // Simple overlap: length of longest common prefix / max length
    let overlap = 0
    for (let i = 0; i < Math.min(candidate.length, target.length); i++) {
      if (candidate[i] === target[i]) overlap++
      else break
    }
    const score = overlap / Math.max(candidate.length, target.length)
    if (score > bestScore) {
      bestScore = score
      best = r.id
    }
  }
  return bestScore > 0.4 ? best : null
}

// ─── Property write ────────────────────────────────────────────────────────

export interface NecticSignalPayload {
  riskLevel: string
  signalSummary: string
  arrAtRisk: number
  healthScore: number
}

export async function writeSignalToHubSpot(
  accessToken: string,
  companyId: string,
  payload: NecticSignalPayload
): Promise<boolean> {
  const res = await fetch(
    `https://api.hubapi.com/crm/v3/objects/companies/${companyId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          nectic_risk_level: payload.riskLevel,
          nectic_signal_summary: payload.signalSummary.slice(0, 500),
          nectic_last_signal_date: new Date().toISOString().split("T")[0],
          nectic_arr_at_risk: payload.arrAtRisk,
          nectic_health_score: payload.healthScore,
        },
      }),
    }
  )
  return res.ok
}
