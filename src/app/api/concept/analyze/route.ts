import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

type ParticipantRole = "vendor" | "customer" | "partner" | "other"
type ParticipantRoles = Record<string, ParticipantRole>

interface AccountContext {
  industry?: string
  contractTier?: string
  renewalMonth?: string
}

const SYSTEM_PROMPT = `You are a B2B SaaS customer intelligence analyst specialising in Southeast Asia markets.

You will receive a WhatsApp group conversation, participant roles, and optional account context. The conversation may be in Bahasa Indonesia, English, or code-switched. Analyse it deeply from the CUSTOMER's perspective only.

Your job: surface what the customer actually thinks — churn signals, product pain points, feature requests, relationship health — things the CS/sales rep might have missed or not escalated.

Return ONLY valid JSON. No markdown wrapper, no explanation, just the JSON object.`

function buildParticipantBlock(roles: ParticipantRoles): string {
  const groups: Record<ParticipantRole, string[]> = { vendor: [], customer: [], partner: [], other: [] }
  for (const [name, role] of Object.entries(roles)) groups[role].push(name)
  const lines: string[] = []
  if (groups.vendor.length) lines.push(`- Vendor team (your company): ${groups.vendor.join(", ")}`)
  if (groups.customer.length) lines.push(`- Customer team: ${groups.customer.join(", ")}`)
  if (groups.partner.length) lines.push(`- Partner / reseller: ${groups.partner.join(", ")}`)
  if (groups.other.length) lines.push(`- Other / unknown: ${groups.other.join(", ")}`)
  return lines.length
    ? `PARTICIPANT ROLES:\n${lines.join("\n")}\n\nRisk signals and product signals must come from the CUSTOMER voice (and secondarily PARTNER voice), not the vendor. Do not attribute signals to vendor team members.`
    : ""
}

const USER_PROMPT = (
  conversation: string,
  participantRoles: ParticipantRoles,
  context: AccountContext
) => {
  const participantContext = Object.keys(participantRoles).length > 0
    ? buildParticipantBlock(participantRoles)
    : ""

  const accountContext = [
    context.industry && `Industry: ${context.industry}`,
    context.contractTier && `Contract tier: ${context.contractTier}`,
    context.renewalMonth && `Renewal: ${context.renewalMonth}`,
  ].filter(Boolean).join("\n")

  return `${participantContext ? participantContext + "\n\n" : ""}${accountContext ? `ACCOUNT CONTEXT:\n${accountContext}\n\n` : ""}Analyse this WhatsApp conversation and return a JSON object with EXACTLY this structure:

{
  "accountName": "infer customer company name from context, or 'Unknown Account'",
  "healthScore": <integer 1-10, 10 = very healthy>,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "summary": "<2-3 sentence executive summary of the account situation>",
  "sentimentTrend": "improving" | "stable" | "declining",
  "riskSignals": [
    {
      "quote": "<exact quote from a customer-side participant>",
      "explanation": "<why this is a risk signal>",
      "severity": "low" | "medium" | "high",
      "date": "<date from conversation>"
    }
  ],
  "productSignals": [
    {
      "type": "complaint" | "feature_request" | "praise" | "confusion",
      "title": "<short title, max 8 words>",
      "problemStatement": "<the underlying customer problem in one sentence, not the feature request itself>",
      "quote": "<exact quote from a customer-side participant>",
      "priority": "low" | "medium" | "high",
      "pmAction": "<what the PM should do with this>"
    }
  ],
  "relationshipSignals": [
    {
      "observation": "<e.g. 'Response time from CS has increased', 'Customer tone became formal'>",
      "implication": "<what this signals about the relationship>"
    }
  ],
  "competitorMentions": ["<competitor name if mentioned>"],
  "recommendedAction": {
    "what": "<specific action, max 2 sentences>",
    "owner": "CS" | "PM" | "Sales" | "Engineering",
    "urgency": "immediate" | "this_week" | "this_month"
  },
  "stats": {
    "messageCount": <number>,
    "participantCount": <number>,
    "dateRange": "<e.g. Mar 19 – Mar 28, 2024>",
    "languages": ["Bahasa Indonesia", "English"]
  },
  "analysisQuality": {
    "confidence": "high" | "medium" | "low",
    "caveats": ["<e.g. 'Only 18 messages — signals may not be representative'>", "<e.g. 'Conversation went quiet after Mar 15 — issues may have moved to another channel'>"],
    "dataGaps": ["<e.g. 'Contract value unknown — cannot score renewal risk accurately'>", "<e.g. 'No customer-side messages in the last 7 days'>"]
  }
}

Confidence rules: high = 50+ messages with clear customer voice; medium = 20-49 messages OR ambiguous signals OR uncertain participant roles; low = under 20 messages OR mostly vendor-side OR very short date range.

CONVERSATION:
${conversation}`
}

export interface AnalysisResult {
  accountName: string
  healthScore: number
  riskLevel: "low" | "medium" | "high" | "critical"
  summary: string
  sentimentTrend: "improving" | "stable" | "declining"
  riskSignals: { quote: string; explanation: string; severity: string; date: string }[]
  productSignals: { type: string; title: string; problemStatement?: string; quote: string; priority: string; pmAction: string }[]
  relationshipSignals: { observation: string; implication: string }[]
  competitorMentions: string[]
  recommendedAction: { what: string; owner: string; urgency: string }
  stats: { messageCount: number; participantCount: number; dateRange: string; languages: string[] }
  analysisQuality?: { confidence: "high" | "medium" | "low"; caveats: string[]; dataGaps: string[] }
  changesSince?: { summary: string; newRiskSignals: number; resolvedSignals: number; healthDelta: number }
}

export async function POST(req: NextRequest) {
  try {
    const {
      conversation,
      messageCount,
      participants: participantCount,
      participantRoles = {},
      context = {},
    } = await req.json() as {
      conversation: string
      messageCount?: number
      participants?: number
      participantRoles?: ParticipantRoles
      context?: AccountContext
    }

    if (!conversation || typeof conversation !== "string") {
      return NextResponse.json({ error: "conversation is required" }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 503 })
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nectic.vercel.app",
        "X-Title": "Nectic - WhatsApp Signal Extractor",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT(conversation, participantRoles, context) },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("OpenRouter error:", err)
      return NextResponse.json({ error: "Analysis failed", detail: err }, { status: 502 })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content

    if (!raw) {
      return NextResponse.json({ error: "Empty response from model. Please try again." }, { status: 502 })
    }

    // Strip markdown code fences, then extract the outermost JSON object
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    const jsonMatch = stripped.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("No JSON object found in model response:", stripped.slice(0, 300))
      return NextResponse.json({
        error: "Analysis could not be completed. The model returned an unexpected format — please try again.",
      }, { status: 502 })
    }

    let result: AnalysisResult
    try {
      result = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr, "raw:", stripped.slice(0, 300))
      return NextResponse.json({
        error: "Analysis could not be completed. Please try again — if the issue persists, try a shorter conversation.",
      }, { status: 502 })
    }

    if (messageCount) result.stats.messageCount = messageCount
    if (participantCount) result.stats.participantCount = participantCount

    return NextResponse.json({ result }, { status: 200 })
  } catch (err: unknown) {
    console.error("Concept analyze error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
