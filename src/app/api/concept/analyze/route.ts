import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

const SYSTEM_PROMPT = `You are a B2B SaaS customer intelligence analyst specializing in Southeast Asia markets.

You will receive a WhatsApp group chat conversation between a sales/CS rep and their customer(s). The conversation may be in Bahasa Indonesia, English, or code-switched (mixed). Analyze it deeply.

Your job: surface what the customer actually thinks about the product — churn signals, product pain points, feature requests, relationship health — things that the CS/sales rep might have missed or not escalated.

Return ONLY valid JSON. No markdown, no explanation, just JSON.`

const USER_PROMPT = (conversation: string) => `Analyze this WhatsApp conversation and return a JSON object with EXACTLY this structure:

{
  "accountName": "infer from context, or 'Unknown Account'",
  "healthScore": <integer 1-10, 10 = very healthy>,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "summary": "<2-3 sentence executive summary of the account situation>",
  "sentimentTrend": "improving" | "stable" | "declining",
  "riskSignals": [
    {
      "quote": "<exact quote from conversation>",
      "explanation": "<why this is a risk signal, in English>",
      "severity": "low" | "medium" | "high",
      "date": "<date from conversation>"
    }
  ],
  "productSignals": [
    {
      "type": "complaint" | "feature_request" | "praise" | "confusion",
      "title": "<short title, max 8 words>",
      "quote": "<exact quote>",
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
    "dateRange": "<e.g. Feb 1–21, 2026>",
    "languages": ["Bahasa Indonesia", "English"]
  }
}

CONVERSATION:
${conversation}`

export interface AnalysisResult {
  accountName: string
  healthScore: number
  riskLevel: "low" | "medium" | "high" | "critical"
  summary: string
  sentimentTrend: "improving" | "stable" | "declining"
  riskSignals: { quote: string; explanation: string; severity: string; date: string }[]
  productSignals: { type: string; title: string; quote: string; priority: string; pmAction: string }[]
  relationshipSignals: { observation: string; implication: string }[]
  competitorMentions: string[]
  recommendedAction: { what: string; owner: string; urgency: string }
  stats: { messageCount: number; participantCount: number; dateRange: string; languages: string[] }
}

export async function POST(req: NextRequest) {
  try {
    const { conversation, messageCount, participants } = await req.json()

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
          { role: "user", content: USER_PROMPT(conversation) },
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

    const result: AnalysisResult = JSON.parse(raw)

    // Patch stats with accurate parser counts if provided
    if (messageCount) result.stats.messageCount = messageCount
    if (participants) result.stats.participantCount = participants

    return NextResponse.json({ result }, { status: 200 })
  } catch (err: unknown) {
    console.error("Concept analyze error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
