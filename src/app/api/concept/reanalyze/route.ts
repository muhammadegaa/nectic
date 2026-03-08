import { NextRequest, NextResponse } from "next/server"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"
import { buildSignalActionsBlock, type SignalAction } from "@/lib/signal-utils"
import { callAI } from "@/lib/ai-client"

export const maxDuration = 60

const SYSTEM_PROMPT = `You are a B2B SaaS customer intelligence analyst specialising in Southeast Asia markets.

You are updating an existing account analysis with new WhatsApp conversation data. Your job is to produce an updated analysis that reflects the current state of the account, and to surface what has changed since the previous analysis.

Language guidance for SEA conversations:
- Bahasa Indonesia often expresses dissatisfaction indirectly. "Agak", "lumayan", "nanti saja" signal avoidance that can mask deeper issues.
- Code-switching from Bahasa to English often signals emphasis or escalation.
- Formal tone shift (casual → formal Indonesian) signals unhappiness.
- If the conversation is predominantly Bahasa Indonesia (>50% non-English), lower confidence one level and note it in caveats.

Return ONLY valid JSON. No markdown wrapper, no explanation.`

type ParticipantRole = "vendor" | "customer" | "partner" | "other"
type ParticipantRoles = Record<string, ParticipantRole>

interface WorkspaceContext {
  productDescription?: string
  featureAreas?: string
  roadmapFocus?: string
  knownIssues?: string
  notificationEmail?: string
  productStory?: string
}

function buildWorkspaceBlock(ws?: WorkspaceContext): string {
  if (!ws) return ""
  const lines = [
    ws.productStory && `Company story: ${ws.productStory}`,
    ws.productDescription && `Product: ${ws.productDescription}`,
    ws.featureAreas && `Feature areas: ${ws.featureAreas}`,
    ws.roadmapFocus && `Roadmap this quarter: ${ws.roadmapFocus}`,
    ws.knownIssues && `Known issues: ${ws.knownIssues}`,
  ].filter(Boolean)
  return lines.length ? `WORKSPACE CONTEXT:\n${lines.join("\n")}\n\n` : ""
}

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
  signalActions: Record<string, SignalAction> | null,
  workspace?: WorkspaceContext
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

  return `${buildWorkspaceBlock(workspace)}${participantContext}PREVIOUS ANALYSIS (from ${prior.stats.dateRange}):
${JSON.stringify(prior, null, 2)}
${actionsBlock}${contextBlock}${messagesBlock}

Produce a fully updated analysis using the same JSON structure as the previous analysis, adjusting confidence, health score, risk signals, caveats, and data gaps wherever the new context changes your assessment. For every riskSignal and productSignal include a "title" (5 words max, scannable label) and "suggestedActions" array with 2–3 specific executable steps (each with "step", "owner": CS|PM|Engineering|Sales, "timeline": 24h|this_week|this_month). Also add a "changesSince" field:

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
      workspace,
    } = await req.json() as {
      priorAnalysis: AnalysisResult
      conversation?: string | null
      messageCount?: number
      participantRoles?: Record<string, "vendor" | "customer" | "partner" | "other">
      supplementalContext?: string | null
      signalActions?: Record<string, SignalAction> | null
      workspace?: WorkspaceContext
    }

    if (!priorAnalysis) {
      return NextResponse.json({ error: "priorAnalysis is required" }, { status: 400 })
    }
    if (!conversation && !supplementalContext) {
      return NextResponse.json({ error: "Provide conversation or supplementalContext" }, { status: 400 })
    }

    let raw: string
    try {
      raw = await callAI({
        system: SYSTEM_PROMPT,
        user: USER_PROMPT(priorAnalysis, conversation, participantRoles, supplementalContext, signalActions, workspace),
        maxTokens: 4096,
        temperature: 0.2,
      })
    } catch (aiErr) {
      return NextResponse.json({ error: "Re-analysis failed", detail: String(aiErr) }, { status: 502 })
    }
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

    // Fire notifications — best-effort, never blocks response
    if (workspace?.notificationEmail) {
      const notifyUrl = new URL(req.url)
      notifyUrl.pathname = "/api/concept/notify"

      // Risk alert for critical/high
      if (result.riskLevel === "critical" || result.riskLevel === "high") {
        fetch(notifyUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountName: result.accountName,
            riskLevel: result.riskLevel,
            signalCount: (result.riskSignals?.length ?? 0) + (result.productSignals?.length ?? 0),
            topSignalTitle: result.riskSignals?.[0]?.title ?? result.riskSignals?.[0]?.explanation?.slice(0, 80),
            topSignalQuote: result.riskSignals?.[0]?.quote,
            email: workspace.notificationEmail,
          }),
        }).catch(() => {})
      }

      // Competitor alert — fires regardless of riskLevel
      if (result.competitorMentions?.length > 0) {
        fetch(notifyUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountName: result.accountName,
            riskLevel: result.riskLevel,
            signalCount: (result.riskSignals?.length ?? 0) + (result.productSignals?.length ?? 0),
            topSignalQuote: result.riskSignals?.[0]?.quote,
            competitorNames: result.competitorMentions,
            isCompetitorAlert: true,
            email: workspace.notificationEmail,
          }),
        }).catch(() => {})
      }
    }

    return NextResponse.json({ result }, { status: 200 })
  } catch (err: unknown) {
    console.error("Reanalyze error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}
