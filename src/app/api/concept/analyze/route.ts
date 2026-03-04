import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

interface AccountContext {
  industry?: string
  contractTier?: string
  renewalMonth?: string
}

const SYSTEM_PROMPT = `You are a B2B SaaS customer intelligence analyst specialising in Southeast Asia markets.

You will receive a WhatsApp group conversation, participant roles, and optional account context. The conversation may be in Bahasa Indonesia, English, or code-switched. Analyse it deeply from the CUSTOMER's perspective only.

Your job: surface what the customer actually thinks — churn signals, product pain points, feature requests, relationship health — things the CS/sales rep might have missed or not escalated.

Return ONLY valid JSON. No markdown wrapper, no explanation, just the JSON object.`

const USER_PROMPT = (
  conversation: string,
  vendorParticipants: string[],
  customerParticipants: string[],
  context: AccountContext
) => {
  const participantContext = vendorParticipants.length > 0 || customerParticipants.length > 0
    ? `PARTICIPANT ROLES:
- Vendor team (your company): ${vendorParticipants.length ? vendorParticipants.join(", ") : "unknown"}
- Customer team: ${customerParticipants.length ? customerParticipants.join(", ") : "unknown"}

Analyse ONLY from the customer's perspective. Risk signals and product signals must come from the customer voice, not the vendor.`
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
  }
}

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
  changesSince?: { summary: string; newRiskSignals: number; resolvedSignals: number; healthDelta: number }
}

export async function POST(req: NextRequest) {
  try {
    const {
      conversation,
      messageCount,
      participants: participantCount,
      vendorParticipants = [],
      customerParticipants = [],
      context = {},
    } = await req.json()

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
        model: "anthropic/claude-3.5-sonnet",
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT(conversation, vendorParticipants, customerParticipants, context) },
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
      return NextResponse.json({ error: "Empty response from model" }, { status: 502 })
    }

    // Strip markdown code fences if model wraps the JSON
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    const result: AnalysisResult = JSON.parse(cleaned)

    if (messageCount) result.stats.messageCount = messageCount
    if (participantCount) result.stats.participantCount = participantCount

    return NextResponse.json({ result }, { status: 200 })
  } catch (err: unknown) {
    console.error("Concept analyze error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
