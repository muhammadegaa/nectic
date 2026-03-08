import { NextRequest, NextResponse } from "next/server"
import { callAI } from "@/lib/ai-client"

export const maxDuration = 30

interface WorkspaceContext {
  productDescription?: string
  featureAreas?: string
  productStory?: string
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
      tone,
    } = await req.json() as {
      signalTitle: string
      signalExplanation?: string
      quote: string
      signalCategory: "risk" | "product"
      accountName: string
      workspace?: WorkspaceContext
      tone?: ToneAdjustment
    }

    if (!signalTitle || !quote || !accountName) {
      return NextResponse.json({ error: "signalTitle, quote, and accountName are required" }, { status: 400 })
    }

    const productContext = workspace?.productStory
      ? `You represent: ${workspace.productStory}`
      : workspace?.productDescription
      ? `Your product: ${workspace.productDescription}`
      : ""

    const toneInstruction = tone === "shorter"
      ? "TONE: Make it shorter — 1-2 sentences maximum. Cut any pleasantry that isn't essential."
      : tone === "more_formal"
      ? "TONE: Use a more formal register — avoid contractions, use full sentences, maintain professional distance while staying warm."
      : tone === "bahasa"
      ? "TONE: Write entirely in Bahasa Indonesia regardless of the original quote language."
      : ""

    // Detect Bahasa from quote heuristic
    const isBahasaQuote = /\b(tidak|iya|saya|kami|tolong|sudah|belum|bisa|mohon|terima kasih|halo|pak|bu|mas|kak)\b/i.test(quote)

    const systemPrompt = `You are a CS manager sending a WhatsApp message to a customer. You are writing as yourself — a human, not a company chatbot.

CRITICAL RULES — never break these:
- Never open with "Halo kami dari [company]" or any company-introduction opener
- Never use "kami" to mean yourself — use "saya" (I/me) for first-person; "kami" only when genuinely referring to the whole team taking collective action
- Never end with a formal sign-off ("Salam hangat", "Best regards", "Hormat kami") — WhatsApp doesn't need it
- Never use placeholders like [Name] — write as if you already know who you're addressing
- No bullet points, no markdown — plain conversational prose only
- Do NOT fabricate promises you can't keep (deadlines, specific fixes)

VOICE:
- Acknowledge the pain point directly — don't minimise it
- Show personal ownership: "Saya akan..." / "I'll personally..." not "The team will look into"
- 2-3 sentences is the target — enough to feel human, short enough for WhatsApp
- Address the customer by first name if you can infer it from context; if not, use appropriate register (Kak / Mas / Bu + name if Bahasa)

LANGUAGE:
${isBahasaQuote ? "- The customer writes in Bahasa Indonesia — respond in Bahasa Indonesia" : "- The customer writes in English — respond in English"}
- If mixed, follow the customer's dominant language

${toneInstruction}

${productContext}`

    const userPrompt = `Draft a WhatsApp message responding to this customer signal.

Account: ${accountName}
Signal: ${signalTitle}
${signalExplanation ? `Why it matters: ${signalExplanation}` : ""}
What they said: "${quote}"

Write only the message text. No label, no header, no explanation.`

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
