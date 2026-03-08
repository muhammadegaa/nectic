import { NextRequest, NextResponse } from "next/server"
import { callAI } from "@/lib/ai-client"

export const maxDuration = 30

interface WorkspaceContext {
  productDescription?: string
  featureAreas?: string
  productStory?: string
}

export async function POST(req: NextRequest) {
  try {
    const {
      signalTitle,
      signalExplanation,
      quote,
      signalCategory,
      accountName,
      workspace,
    } = await req.json() as {
      signalTitle: string
      signalExplanation?: string
      quote: string
      signalCategory: "risk" | "product"
      accountName: string
      workspace?: WorkspaceContext
    }

    if (!signalTitle || !quote || !accountName) {
      return NextResponse.json({ error: "signalTitle, quote, and accountName are required" }, { status: 400 })
    }

    const productContext = workspace?.productStory
      ? `Company: ${workspace.productStory}`
      : workspace?.productDescription
      ? `Your product: ${workspace.productDescription}`
      : ""

    const systemPrompt = `You are a senior Customer Success manager drafting a WhatsApp response to address a customer signal.

Guidelines:
- Write in a warm, professional, and direct tone
- Keep it to 2-3 sentences maximum — WhatsApp messages should be concise
- If the conversation was likely in Bahasa Indonesia (infer from the quote), write in Bahasa Indonesia
- Otherwise write in English
- Start with acknowledgment, then show ownership/action, then set expectation
- Never be defensive. Never make excuses. Show empathy and urgency.
- Do NOT use bullet points or markdown — plain conversational text only
- Do NOT use placeholders like [Name] — write as if addressing the account directly

${productContext}`

    const userPrompt = `Draft a WhatsApp response for this customer signal.

Account: ${accountName}
Signal type: ${signalCategory === "risk" ? "Risk / churn signal" : "Product signal"}
Signal: ${signalTitle}
${signalExplanation ? `Context: ${signalExplanation}` : ""}
Customer said: "${quote}"

Write only the draft message, nothing else.`

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
