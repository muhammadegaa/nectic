import { NextRequest } from "next/server"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"

export const maxDuration = 60

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const SYSTEM_PROMPT = (analysis: AnalysisResult) => `You are a senior PM co-pilot embedded in Nectic, a product intelligence tool for B2B SaaS teams in Southeast Asia.

You have full context of the following customer account analysis. This analysis was extracted from real WhatsApp conversations between a CS/sales rep and their customer.

ACCOUNT ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Your job:
- Answer questions about this account as a senior PM who has read every message
- Be specific — cite exact signals, quotes, and risk indicators from the analysis above
- Be direct — no hedging, no corporate fluff
- When asked what to do, give a concrete recommendation
- When asked to write something (CS talking points, Jira ticket, meeting agenda), write it fully
- If the question is about a pattern across accounts, note that you only have context for this one account

The conversation may be about a SEA B2B SaaS company. Account relationships often happen in WhatsApp in Bahasa Indonesia or English. Treat this as real customer intelligence.`

export async function POST(req: NextRequest) {
  try {
    const { analysis, messages, question } = await req.json() as {
      analysis: AnalysisResult
      messages: ChatMessage[]
      question: string
    }

    if (!question || !analysis) {
      return new Response("Missing question or analysis", { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return new Response("OPENROUTER_API_KEY not configured", { status: 503 })
    }

    const chatMessages = [
      ...messages,
      { role: "user" as const, content: question },
    ]

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nectic.vercel.app",
        "X-Title": "Nectic - PM Co-pilot Chat",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        temperature: 0.3,
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT(analysis) },
          ...chatMessages,
        ],
      }),
    })

    if (!response.ok || !response.body) {
      const err = await response.text()
      return new Response(`OpenRouter error: ${err}`, { status: 502 })
    }

    // Pipe the SSE stream directly to the client
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    ;(async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            await writer.close()
            break
          }
          const chunk = decoder.decode(value, { stream: true })
          // Parse SSE lines and forward only the text content
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const parsed = JSON.parse(data)
              const token = parsed.choices?.[0]?.delta?.content
              if (token) {
                await writer.write(new TextEncoder().encode(token))
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } catch {
        await writer.abort()
      }
    })()

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(message, { status: 500 })
  }
}
