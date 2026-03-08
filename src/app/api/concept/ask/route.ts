import { NextRequest, NextResponse } from "next/server"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"

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

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 })
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        temperature: 0.3,
        system: `You are a Customer Success analyst. You answer ONE specific question about an account based strictly on the analysis data provided. Answer in 1-3 sentences maximum. Be direct and specific — cite actual signals, quotes, or scores. Never speculate beyond what the data shows. Never use bullet points.`,
        messages: [
          {
            role: "user",
            content: `Account analysis:\n${accountSummary}\n\nQuestion: ${question}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Anthropic ask error:", err)
      return NextResponse.json({ error: "Could not answer question" }, { status: 502 })
    }

    const data = await response.json()
    const answer = data.content?.[0]?.text?.trim()

    if (!answer) {
      return NextResponse.json({ error: "Empty response" }, { status: 502 })
    }

    return NextResponse.json({ answer }, { status: 200 })
  } catch (err: unknown) {
    console.error("Ask error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}
