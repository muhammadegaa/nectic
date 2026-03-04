import { NextRequest, NextResponse } from "next/server"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"
import { buildSignalActionsBlock, type SignalAction } from "@/lib/signal-utils"

export const maxDuration = 60

const SYSTEM_PROMPT = `You are a B2B SaaS customer intelligence analyst specialising in Southeast Asia markets.

You are updating an existing account analysis with new WhatsApp conversation data. Your job is to produce an updated analysis that reflects the current state of the account, and to surface what has changed since the previous analysis.

Return ONLY valid JSON. No markdown wrapper, no explanation.`

type ParticipantRole = "vendor" | "customer" | "partner" | "other"
type ParticipantRoles = Record<string, ParticipantRole>

function buildParticipantBlock(roles: ParticipantRoles): string {
  const groups: Record<ParticipantRole, string[]> = { vendor: [], customer: [], partner: [], other: [] }
  for (const [name, role] of Object.entries(roles)) groups[role].push(name)
  const lines: string[] = []
  if (groups.vendor.length) lines.push(`- Vendor team: ${groups.vendor.join(", ")}`)
  if (groups.customer.length) lines.push(`- Customer team: ${groups.customer.join(", ")}`)
  if (groups.partner.length) lines.push(`- Partner / reseller: ${groups.partner.join(", ")}`)
  if (groups.other.length) lines.push(`- Other: ${groups.other.join(", ")}`)
  return lines.length ? `PARTICIPANT ROLES:\n${lines.join("\n")}\n\n` : ""
}

const USER_PROMPT = (
  prior: AnalysisResult,
  newConversation: string | null,
  participantRoles: ParticipantRoles,
  supplementalContext: string | null,
  signalActions: Record<string, SignalAction> | null
) => {
  const participantContext = Object.keys(participantRoles).length > 0
    ? buildParticipantBlock(participantRoles)
    : ""

  const contextBlock = supplementalContext?.trim()
    ? `\nADDITIONAL CONTEXT PROVIDED BY PM:\n${supplementalContext.trim()}\n`
    : ""

  const actionsBlock = signalActions
    ? buildSignalActionsBlock(signalActions, prior)
    : ""

  const messagesBlock = newConversation?.trim()
    ? `\nNEW MESSAGES TO INCORPORATE:\n${newConversation}`
    : "\nNO NEW MESSAGES — update is based on additional context only."

  return `${participantContext}PREVIOUS ANALYSIS (from ${prior.stats.dateRange}):
${JSON.stringify(prior, null, 2)}
${actionsBlock}${contextBlock}${messagesBlock}

Produce a fully updated analysis using the same JSON structure as the previous analysis, adjusting confidence, health score, risk signals, caveats, and data gaps wherever the new context changes your assessment. Also add a "changesSince" field:

{
  "changesSince": {
    "summary": "<1-2 sentences describing what changed>",
    "newRiskSignals": <count of new risk signals not in previous analysis>,
    "resolvedSignals": <count of issues that appear resolved or clarified by the new context>,
    "healthDelta": <integer, positive = improved, negative = declined, 0 = stable>
  }
}`
}

export async function POST(req: NextRequest) {
  try {
    const {
      priorAnalysis,
      conversation = null,
      messageCount,
      participantRoles = {},
      supplementalContext = null,
      signalActions = null,
    } = await req.json() as {
      priorAnalysis: AnalysisResult
      conversation?: string | null
      messageCount?: number
      participantRoles?: Record<string, "vendor" | "customer" | "partner" | "other">
      supplementalContext?: string | null
      signalActions?: Record<string, SignalAction> | null
    }

    if (!priorAnalysis) {
      return NextResponse.json({ error: "priorAnalysis is required" }, { status: 400 })
    }
    if (!conversation && !supplementalContext) {
      return NextResponse.json({ error: "Provide conversation or supplementalContext" }, { status: 400 })
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
        "X-Title": "Nectic - Account Re-analysis",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.6",
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT(priorAnalysis, conversation, participantRoles, supplementalContext, signalActions) },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: "Re-analysis failed", detail: err }, { status: 502 })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content
    if (!raw) return NextResponse.json({ error: "Empty response from model. Please try again." }, { status: 502 })

    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    const jsonMatch = stripped.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("No JSON in reanalyze response:", stripped.slice(0, 300))
      return NextResponse.json({ error: "Re-analysis failed — model returned unexpected format. Please try again." }, { status: 502 })
    }
    let result: AnalysisResult
    try {
      result = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      console.error("Reanalyze JSON parse failed:", parseErr)
      return NextResponse.json({ error: "Re-analysis could not be completed. Please try again." }, { status: 502 })
    }
    if (messageCount) result.stats.messageCount = messageCount

    return NextResponse.json({ result }, { status: 200 })
  } catch (err: unknown) {
    console.error("Reanalyze error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}
