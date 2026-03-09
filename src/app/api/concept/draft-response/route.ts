import { NextRequest, NextResponse } from "next/server"
import { callAI } from "@/lib/ai-client"

export const maxDuration = 30

interface WorkspaceContext {
  productDescription?: string
  featureAreas?: string
  productStory?: string
  csPersonaName?: string
  communicationStyle?: "formal" | "warm" | "casual"
  csEscalationProcess?: string
  companyVoiceSamples?: string[]
}

interface RelationshipSignal {
  observation: string
  implication: string
}

interface AccountContext {
  summary?: string
  sentimentTrend?: "improving" | "stable" | "declining"
  riskLevel?: string
  relationshipSignals?: RelationshipSignal[]
  competitorMentions?: string[]
  recommendedAction?: { what: string; owner: string; urgency: string }
  stats?: { messageCount?: number; dateRange?: string; languages?: string[] }
  otherRiskSignals?: { title?: string; explanation?: string; severity?: string }[]
}

type ToneAdjustment = "shorter" | "more_formal" | "bahasa"

export async function POST(req: NextRequest) {
  try {
    const {
      signalTitle,
      signalExplanation,
      quote,
      signalCategory,
      accountName,
      workspace,
      accountContext,
      tone,
    } = await req.json() as {
      signalTitle: string
      signalExplanation?: string
      quote: string
      signalCategory: "risk" | "product"
      accountName: string
      workspace?: WorkspaceContext
      accountContext?: AccountContext
      tone?: ToneAdjustment
    }

    if (!signalTitle || !quote || !accountName) {
      return NextResponse.json({ error: "signalTitle, quote, and accountName are required" }, { status: 400 })
    }

    // Language detection: trust the analysis stats first (most reliable), fall back to quote heuristic
    const analysisLanguages = accountContext?.stats?.languages ?? []
    const isBahasa = tone === "bahasa"
      || analysisLanguages.some((l) => l.toLowerCase().includes("bahasa") || l.toLowerCase().includes("indonesia"))
      || /\b(tidak|iya|saya|kami|tolong|sudah|belum|bisa|mohon|terima kasih|pak|bu|mas|kak|gimana|banget|dong|lho|ya|nih)\b/i.test(quote)

    const language = isBahasa ? "Bahasa Indonesia" : "English"

    // Build relationship context block — this is what makes the draft feel situational, not generic
    const relationshipContext = accountContext?.relationshipSignals?.length
      ? accountContext.relationshipSignals
          .map((r) => `- ${r.observation} → ${r.implication}`)
          .join("\n")
      : ""

    const sentimentNote = accountContext?.sentimentTrend === "declining"
      ? "Sentiment is declining — this message needs to rebuild trust, not just acknowledge the issue."
      : accountContext?.sentimentTrend === "improving"
      ? "Sentiment is improving — reinforce momentum."
      : ""

    const competitorNote = accountContext?.competitorMentions?.length
      ? `Customer has mentioned competitor(s): ${accountContext.competitorMentions.join(", ")}. This is an account at risk of switching — the message must demonstrate concrete value or action, not platitudes.`
      : ""

    const otherSignalsNote = accountContext?.otherRiskSignals?.length
      ? `Other open issues in this account: ${accountContext.otherRiskSignals.map((s) => s.title || s.explanation).slice(0, 3).join("; ")}. Acknowledge if relevant, but don't overload this one message.`
      : ""

    const productContext = workspace?.productStory
      ? `You represent: ${workspace.productStory}`
      : workspace?.productDescription
      ? `Your product: ${workspace.productDescription}`
      : ""

    // Who is writing — if no name, stay as anonymous CS manager
    const personaLine = workspace?.csPersonaName
      ? `You are ${workspace.csPersonaName}, a CS manager at this company.`
      : `You are a CS manager at this company.`

    // Company communication style
    const styleInstruction = workspace?.communicationStyle === "formal"
      ? "Your team writes formally — full sentences, no contractions, professional distance while staying helpful."
      : workspace?.communicationStyle === "casual"
      ? "Your team writes casually — short sentences, natural contractions, conversational and warm."
      : workspace?.communicationStyle === "warm"
      ? "Your team writes in a warm, professional tone — direct but empathetic, never stiff."
      : ""

    // Voice samples from the company's own past messages
    const voiceSamplesBlock = workspace?.companyVoiceSamples?.length
      ? `Here are examples of how your team actually writes to customers:\n${workspace.companyVoiceSamples.slice(0, 3).map((s, i) => `${i + 1}. "${s}"`).join("\n")}\nMatch this voice — same register, same level of formality, similar length.`
      : ""

    // Escalation process for critical signals
    const escalationBlock = accountContext?.riskLevel === "critical" && workspace?.csEscalationProcess
      ? `Your escalation process for critical accounts: ${workspace.csEscalationProcess}. Reference this if it affects the message.`
      : ""

    const toneInstruction = tone === "shorter"
      ? "LENGTH: 1-2 sentences only. Cut anything that isn't essential to the action or acknowledgment."
      : tone === "more_formal"
      ? "REGISTER: Formal Bahasa Indonesia or formal English — full sentences, no contractions, respectful distance."
      : ""

    const systemPrompt = `${personaLine} You are writing a WhatsApp reply in an ongoing conversation with a customer — a human, not a company bot.

${productContext}
${styleInstruction ? `\nCOMMUNICATION STYLE: ${styleInstruction}` : ""}
${voiceSamplesBlock ? `\nYOUR TEAM'S VOICE:\n${voiceSamplesBlock}` : ""}
${escalationBlock ? `\nESCALATION: ${escalationBlock}` : ""}

WHAT YOU KNOW ABOUT THIS ACCOUNT:
${accountContext?.summary ? `Situation: ${accountContext.summary}` : ""}
${sentimentNote}
${competitorNote}
${relationshipContext ? `Relationship signals:\n${relationshipContext}` : ""}
${otherSignalsNote}

HOW TO WRITE THIS MESSAGE:
- You are REPLYING in an ongoing thread — do not introduce yourself, do not start fresh
- Reference what actually happened or what they actually said — not a generic version of it
- Show personal ownership: "Saya akan cek langsung" / "I'll look into this now" — not "The team will investigate"
- 2-3 sentences. WhatsApp is not email.
- Do not minimise their problem. Do not be defensive. Do not make promises you can't keep.
- No sign-off. No "Salam hangat". No "Best regards". It's a WhatsApp message.
- No placeholders like [Name]. Write as if you already know who this is.
- No bullet points. No markdown. Plain prose.
- If the account is at critical risk or a competitor was mentioned, the message must signal concrete urgency — not polite acknowledgment.

${toneInstruction}

LANGUAGE: Write in ${language}. Match the register the customer uses in their own messages.`

    const userPrompt = `Write a WhatsApp reply for this situation.

Account: ${accountName}
The signal you're responding to: ${signalTitle}
${signalExplanation ? `Why this matters: ${signalExplanation}` : ""}
What the customer said: "${quote}"
${accountContext?.riskLevel ? `Account risk level: ${accountContext.riskLevel}` : ""}
${accountContext?.recommendedAction ? `Recommended action (for context): ${accountContext.recommendedAction.what}` : ""}

Write only the message. Nothing else.`

    let draft: string
    try {
      draft = (await callAI({ system: systemPrompt, user: userPrompt, maxTokens: 300, temperature: 0.4 })).trim()
    } catch (aiErr) {
      console.error("AI error:", aiErr)
      return NextResponse.json({ error: "Draft generation failed" }, { status: 502 })
    }

    if (!draft) {
      return NextResponse.json({ error: "Empty response from model" }, { status: 502 })
    }

    return NextResponse.json({ draft }, { status: 200 })
  } catch (err: unknown) {
    console.error("Draft response error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
