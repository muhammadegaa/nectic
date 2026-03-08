import { NextRequest, NextResponse } from "next/server"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"
import { callAI } from "@/lib/ai-client"

export const maxDuration = 20

export async function POST(req: NextRequest) {
  try {
    const { question, result, accountName } = await req.json() as {
      question: string
      result: AnalysisResult
      accountName: string
    }

    if (!question?.trim() || !result) {
      return NextResponse.json({ error: "question and result are required" }, { status: 400 })
    }

    const accountSummary = `
Account: ${accountName}
Health score: ${result.healthScore}/10 (${result.riskLevel} risk)
Summary: ${result.summary}
Sentiment trend: ${result.sentimentTrend}
Risk signals: ${(result.riskSignals ?? []).map((s) => `- ${(s as { title?: string }).title ?? s.explanation?.slice(0, 80)} (${s.severity}): "${s.quote?.slice(0, 100)}"`).join("\n")}
Product signals: ${(result.productSignals ?? []).map((s) => `- ${s.title} (${s.priority}): ${s.pmAction}`).join("\n")}
Recommended action: ${result.recommendedAction?.what} — owner: ${result.recommendedAction?.owner}, urgency: ${result.recommendedAction?.urgency}
Competitor mentions: ${result.competitorMentions?.join(", ") || "none"}
`.trim()

    let answer: string
    try {
      answer = (await callAI({
        system: `You are a Customer Success analyst. You answer ONE specific question about an account based strictly on the analysis data provided. Answer in 1-3 sentences maximum. Be direct and specific — cite actual signals, quotes, or scores. Never speculate beyond what the data shows. Never use bullet points.`,
        user: `Account analysis:\n${accountSummary}\n\nQuestion: ${question}`,
        maxTokens: 200,
        temperature: 0.3,
      })).trim()
    } catch (aiErr) {
      console.error("Ask AI error:", aiErr)
      return NextResponse.json({ error: "Could not answer question" }, { status: 502 })
    }

    if (!answer) {
      return NextResponse.json({ error: "Empty response" }, { status: 502 })
    }

    return NextResponse.json({ answer }, { status: 200 })
  } catch (err: unknown) {
    console.error("Ask error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}
