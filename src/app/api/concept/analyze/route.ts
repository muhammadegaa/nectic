import { NextRequest, NextResponse } from "next/server"
import { callAI } from "@/lib/ai-client"

export const maxDuration = 60

type ParticipantRole = "vendor" | "customer" | "partner" | "other"
type ParticipantRoles = Record<string, ParticipantRole>

interface AccountContext {
  industry?: string
  contractTier?: string
  renewalMonth?: string
}

interface WorkspaceContext {
  productDescription?: string
  featureAreas?: string
  roadmapFocus?: string
  knownIssues?: string
  notificationEmail?: string
  productStory?: string
}

const SYSTEM_PROMPT = `You are a B2B SaaS customer intelligence analyst specialising in Southeast Asia markets.

You will receive a WhatsApp group conversation, participant roles, and optional account context. The conversation may be in Bahasa Indonesia, English, or code-switched (Bahasa + English mixed). Analyse it deeply from the CUSTOMER's perspective only.

Your job: surface what the customer actually thinks — churn signals, product pain points, feature requests, relationship health — things the CS/sales rep might have missed or not escalated.

Language guidance for SEA conversations:
- Bahasa Indonesia often expresses dissatisfaction indirectly. "Agak" (somewhat), "lumayan" (fairly), "nanti saja" (later/we'll see) signal low urgency or avoidance that can mask deeper issues.
- Code-switching from Bahasa to English mid-sentence often signals emphasis or escalation to a serious point.
- "Iya iya" (yes yes) without follow-up action is a soft rejection pattern.
- Formal tone shift (from casual Bahasa to formal Indonesian) often signals unhappiness or escalation.

If the conversation is predominantly Bahasa Indonesia (>50% non-English messages), set analysisQuality.confidence one level lower than you would for English-only, and add a caveat noting the language.

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

const USER_PROMPT = (
  conversation: string,
  participantRoles: ParticipantRoles,
  context: AccountContext,
  workspace?: WorkspaceContext
) => {
  const participantContext = Object.keys(participantRoles).length > 0
    ? buildParticipantBlock(participantRoles)
    : ""

  const accountContext = [
    context.industry && `Industry: ${context.industry}`,
    context.contractTier && `Contract tier: ${context.contractTier}`,
    context.renewalMonth && `Renewal: ${context.renewalMonth}`,
  ].filter(Boolean).join("\n")

  return `${buildWorkspaceBlock(workspace)}${participantContext ? participantContext + "\n\n" : ""}${accountContext ? `ACCOUNT CONTEXT:\n${accountContext}\n\n` : ""}Analyse this WhatsApp conversation and return a JSON object with EXACTLY this structure:

{
  "accountName": "infer customer company name from context, or 'Unknown Account'",
  "healthScore": <integer 1-10, 10 = very healthy>,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "summary": "<2-3 sentence executive summary of the account situation>",
  "sentimentTrend": "improving" | "stable" | "declining",
  "riskSignals": [
    {
      "title": "<write this like a sharp colleague flagging it in Slack — name the actual situation, not a category. BAD: 'engagement below threshold' / 'delivery issue causing frustration'. GOOD: 'hasn't logged in since the integration broke' / 'waiting 2 weeks for refund with no update' / 'went quiet after we missed the go-live date'. Max 8 words. Be specific.>",
      "quote": "<the single most important exact quote from a customer-side participant>",
      "evidence": ["<second supporting quote if present>", "<third supporting quote if present — omit if fewer than 2 additional quotes>"],
      "explanation": "<why this is a risk signal — 1-2 sentences connecting the evidence to the risk conclusion>",
      "confidenceLevel": "high" | "medium" | "low",
      "severity": "low" | "medium" | "high",
      "date": "<date from conversation>",
      "suggestedActions": [
        {
          "step": "<specific, executable action — not vague, e.g. 'Schedule a 15-min CS call to acknowledge the delay and set a new ETA'>",
          "owner": "CS" | "PM" | "Engineering" | "Sales",
          "timeline": "24h" | "this_week" | "this_month"
        }
      ]
    }
  ],
  "productSignals": [
    {
      "type": "complaint" | "feature_request" | "praise" | "confusion",
      "title": "<the Jira ticket title a PM would actually write — name the specific failure or request, not the category. BAD: 'API performance issue' / 'user management complaint'. GOOD: 'bulk export times out on files over 50 rows' / 'can't reassign tasks without losing history'. Max 8 words.>",
      "problemStatement": "<the underlying customer problem in one sentence, not the feature request itself>",
      "quote": "<exact quote from a customer-side participant>",
      "confidenceLevel": "high" | "medium" | "low",
      "priority": "low" | "medium" | "high",
      "pmAction": "<what the PM should do with this>",
      "suggestedActions": [
        {
          "step": "<specific, executable action — e.g. 'Check if this feature request appears in 2+ other accounts before scoping'>",
          "owner": "CS" | "PM" | "Engineering" | "Sales",
          "timeline": "24h" | "this_week" | "this_month"
        }
      ]
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
  },
  "coherenceCheck": {
    "score": <integer 0-10 — how relevant is this conversation to the workspace context? 10 = perfect match>,
    "isRelevant": <boolean — false if score < 5>,
    "reason": "<one sentence explaining the score>",
    "flags": ["<e.g. 'Conversation appears to be B2C, workspace describes B2B'>, <'Language/domain mismatch'>"]
  }
}

For suggestedActions: generate 2–3 steps per signal. Each step must be a specific, executable task (not generic like "review the issue" or "follow up"). Owner must match the action (CS for relationship/communication tasks, PM for product decisions, Engineering for technical fixes, Sales for commercial ones). Timeline must match severity/urgency.

Confidence rules (overall): high = 50+ messages with clear customer voice; medium = 20-49 messages OR ambiguous signals OR uncertain participant roles; low = under 20 messages OR mostly vendor-side OR very short date range.

Per-signal confidenceLevel: set "high" if the signal is supported by 2+ direct customer quotes or explicit statements. Set "medium" if inferred from tone, indirect language, or a single message. Set "low" if the signal is speculative or based on absence of response rather than direct evidence. This can differ from the overall analysisQuality.confidence.

Coherence scoring: Compare the conversation content against the workspace context (if provided). Score 10 if the conversation clearly matches the product domain. Score 5-9 if generally relevant. Score 1-4 if there is a significant mismatch (e.g. workspace is B2B SaaS but conversation is personal shopping, or completely different industry). Score 0 if the conversation is not a business communication at all (random CSV, personal chat, unrelated content). If no workspace context was provided, score 7 (assume relevant).

CONVERSATION:
${conversation}`
}

export interface SuggestedAction {
  step: string
  owner: "CS" | "PM" | "Engineering" | "Sales"
  timeline: "24h" | "this_week" | "this_month"
}

export interface AnalysisResult {
  accountName: string
  healthScore: number
  riskLevel: "low" | "medium" | "high" | "critical"
  summary: string
  sentimentTrend: "improving" | "stable" | "declining"
  riskSignals: { title?: string; quote: string; evidence?: string[]; explanation: string; confidenceLevel?: "high" | "medium" | "low"; severity: string; date: string; suggestedActions?: SuggestedAction[] }[]
  productSignals: { type: string; title: string; problemStatement?: string; quote: string; confidenceLevel?: "high" | "medium" | "low"; priority: string; pmAction: string; suggestedActions?: SuggestedAction[] }[]
  relationshipSignals: { observation: string; implication: string }[]
  competitorMentions: string[]
  recommendedAction: { what: string; owner: string; urgency: string }
  stats: { messageCount: number; participantCount: number; dateRange: string; languages: string[] }
  analysisQuality?: { confidence: "high" | "medium" | "low"; caveats: string[]; dataGaps: string[] }
  changesSince?: { summary: string; newRiskSignals: number; resolvedSignals: number; healthDelta: number }
  coherenceCheck?: { score: number; isRelevant: boolean; reason: string; flags: string[] }
}

export async function POST(req: NextRequest) {
  try {
    const {
      conversation,
      messageCount,
      participants: participantCount,
      participantRoles = {},
      context = {},
      workspace,
      bypassCoherenceCheck = false,
    } = await req.json() as {
      conversation: string
      messageCount?: number
      participants?: number
      participantRoles?: ParticipantRoles
      context?: AccountContext
      workspace?: WorkspaceContext
      bypassCoherenceCheck?: boolean
    }

    if (!conversation || typeof conversation !== "string") {
      return NextResponse.json({ error: "conversation is required" }, { status: 400 })
    }

    let raw: string
    try {
      raw = await callAI({
        system: SYSTEM_PROMPT,
        user: USER_PROMPT(conversation, participantRoles, context, workspace),
        maxTokens: 4096,
        temperature: 0.2,
      })
    } catch (aiErr) {
      console.error("AI call error:", aiErr)
      return NextResponse.json({ error: "Analysis failed", detail: String(aiErr) }, { status: 502 })
    }

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

    // Gate 1: Coherence check — reject if score < 4 and workspace context exists (unless bypassed)
    const coherenceCheck = result.coherenceCheck
    if (
      !bypassCoherenceCheck &&
      coherenceCheck &&
      coherenceCheck.score < 4 &&
      (workspace?.productDescription || workspace?.productStory)
    ) {
      return NextResponse.json({
        coherenceRejection: {
          score: coherenceCheck.score,
          reason: coherenceCheck.reason,
          flags: coherenceCheck.flags ?? [],
        }
      }, { status: 200 })
    }

    if (messageCount) result.stats.messageCount = messageCount
    if (participantCount) result.stats.participantCount = participantCount

    if (workspace?.notificationEmail) {
      const notifyUrl = new URL(req.url)
      notifyUrl.pathname = "/api/concept/notify"
      const confidence = result.analysisQuality?.confidence

      // Fire risk alert for critical/high accounts — skip when confidence is low (likely garbage input)
      if ((result.riskLevel === "critical" || result.riskLevel === "high") && confidence !== "low") {
        fetch(notifyUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountName: result.accountName,
            riskLevel: result.riskLevel,
            signalCount: (result.riskSignals?.length ?? 0) + (result.productSignals?.length ?? 0),
            topSignalTitle: result.riskSignals?.[0]?.title ?? result.riskSignals?.[0]?.explanation?.slice(0, 80),
            topSignalQuote: result.riskSignals?.[0]?.quote,
            topSignalExplanation: result.riskSignals?.[0]?.explanation,
            email: workspace.notificationEmail,
          }),
        }).catch(() => {})
      }

      // Fire competitor alert — independent of riskLevel, but skip low confidence
      if (result.competitorMentions?.length > 0 && confidence !== "low") {
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
    console.error("Concept analyze error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
