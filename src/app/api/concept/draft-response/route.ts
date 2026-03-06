import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 30

interface WorkspaceContext {
  productDescription?: string
  featureAreas?: string
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

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 503 })
    }

    const productContext = workspace?.productDescription
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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nectic.vercel.app",
        "X-Title": "Nectic - Draft Response Generator",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.6",
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("OpenRouter error:", err)
      return NextResponse.json({ error: "Draft generation failed" }, { status: 502 })
    }

    const data = await response.json()
    const draft = data.choices?.[0]?.message?.content?.trim()

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
