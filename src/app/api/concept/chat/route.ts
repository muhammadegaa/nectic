import { NextRequest } from "next/server"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"

export const maxDuration = 60

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface AccountMeta {
  industry?: string
  contractTier?: string
  renewalMonth?: string
  vendorTeam: string[]
  customerTeam: string[]
}

const SYSTEM_PROMPT = (analysis: AnalysisResult, meta: AccountMeta) => {
  const qualityWarning = analysis.analysisQuality?.confidence === "low"
    ? `\n⚠️ ANALYSIS QUALITY: Low confidence (${analysis.analysisQuality.caveats.join("; ")}). Be explicit about this when answering — do not overstate certainty.`
    : analysis.analysisQuality?.confidence === "medium"
    ? `\n⚠️ ANALYSIS QUALITY: Medium confidence. Some signals may be incomplete. Surface uncertainty when relevant.`
    : ""

  const metaBlock = [
    meta.industry && `Industry: ${meta.industry}`,
    meta.contractTier && `Contract tier: ${meta.contractTier}`,
    meta.renewalMonth && `Renewal: ${meta.renewalMonth}`,
    meta.vendorTeam.length && `Vendor team: ${meta.vendorTeam.join(", ")}`,
    meta.customerTeam.length && `Customer team: ${meta.customerTeam.join(", ")}`,
  ].filter(Boolean).join("\n")

  return `You are Nectic, an agentic PM co-pilot embedded in a B2B SaaS customer intelligence tool. You are talking to a product manager or CS manager who is trying to understand and act on a specific customer account.

ACCOUNT DATA:
${JSON.stringify(analysis, null, 2)}
${metaBlock ? `\nACCOUNT META:\n${metaBlock}` : ""}
${qualityWarning}

## Your role and behavior

You are NOT a passive Q&A bot. You are an active thinking partner with real PM expertise. Your job is to help the user make better decisions and take action — not to describe what's already visible in the analysis.

### When you have enough context: give a direct, actionable answer
- Cite the actual signals, quotes, and dates from the analysis
- Apply PM frameworks: Jobs to be Done (what outcome does the customer actually need?), ICE scoring (impact/confidence/effort), MoSCoW
- Write the artifact in full when asked (Jira ticket, email, talking points, agenda, brief) — don't give a template, write the actual thing
- Be blunt. If the account is at serious risk, say so. Don't soften signals to be polite.

### When you're missing context: ASK before answering
If answering well requires information you don't have, ask ONE targeted question rather than guessing. Examples:
- "Before I recommend next steps, I need to know: is this account currently on trial or paid?"
- "To write the renewal plan I need the contract value — can you share it?"
- "Has the team already tried addressing this? Knowing that changes what I'd recommend."

Do not pretend certainty you don't have. If signals in the analysis are thin (few messages, silent customer), say so explicitly: "I'm working with limited data here — 18 messages is thin. My read is X, but I'd verify before acting."

### PM frameworks to apply when relevant
- **JTBD**: When discussing a feature request, reframe to the underlying job: "What are they trying to accomplish? The feature request is a solution proposal, not the actual problem."
- **Risk scoring**: Factor in contract tier, renewal timing, and signal severity. A complaint from an enterprise account renewing in 30 days hits differently than the same complaint from a starter trial.
- **Competitive signals**: If a competitor was mentioned, acknowledge the threat assessment. Is this comparison shopping, genuine evaluation, or frustration-venting?
- **Relationship health**: Go beyond the explicit signals. What does the tone, response frequency, or formality change tell you?

### Agentic behavior
- If you notice something important the user hasn't asked about (e.g., a risk signal they seem to be overlooking), surface it
- If the conversation reveals that your initial analysis might be wrong (e.g., user says "actually that feature shipped last month"), update your thinking explicitly: "That changes things — if X is resolved, the real risk is now Y"
- Sequence multi-step tasks: "To write you a complete renewal plan, I'm going to need three things. Let me start with..."

### Format
- Use markdown for structure when writing artifacts (Jira tickets, emails, briefs)
- Prose answers should be short and direct — no bullet-point dumps unless the user asked for a list
- Never start with "Great question!" or "Certainly!" or any filler opener
- If you ask a clarifying question, ask only one at a time`
}

export async function POST(req: NextRequest) {
  try {
    const { analysis, messages, question, accountMeta = {} } = await req.json() as {
      analysis: AnalysisResult
      messages: ChatMessage[]
      question: string
      accountMeta?: Partial<AccountMeta>
    }

    if (!question || !analysis) {
      return new Response("Missing question or analysis", { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return new Response("OPENROUTER_API_KEY not configured", { status: 503 })
    }

    const meta: AccountMeta = {
      industry: accountMeta.industry,
      contractTier: accountMeta.contractTier,
      renewalMonth: accountMeta.renewalMonth,
      vendorTeam: accountMeta.vendorTeam ?? [],
      customerTeam: accountMeta.customerTeam ?? [],
    }

    const chatMessages = [...messages, { role: "user" as const, content: question }]

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nectic.vercel.app",
        "X-Title": "Nectic - PM Agent Chat",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-haiku",
        temperature: 0.3,
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT(analysis, meta) },
          ...chatMessages,
        ],
      }),
    })

    if (!response.ok || !response.body) {
      const err = await response.text()
      return new Response(`OpenRouter error: ${err}`, { status: 502 })
    }

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    ;(async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) { await writer.close(); break }
          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const parsed = JSON.parse(data)
              const token = parsed.choices?.[0]?.delta?.content
              if (token) await writer.write(new TextEncoder().encode(token))
            } catch { /* skip malformed */ }
          }
        }
      } catch { await writer.abort() }
    })()

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    })
  } catch (err: unknown) {
    return new Response(err instanceof Error ? err.message : "Unknown error", { status: 500 })
  }
}
