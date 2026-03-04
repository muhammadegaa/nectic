import { NextRequest } from "next/server"

export const maxDuration = 60

interface ProductSignal {
  type: string
  title: string
  quote: string
  priority: string
  pmAction: string
}

const SYSTEM_PROMPT = `You are a senior product manager writing a concise feature brief.
Output clean, structured markdown. Be specific. Use the customer quote as direct evidence.
Do not add preamble or explanation outside the brief structure.`

const USER_PROMPT = (signal: ProductSignal, accountName: string, accountSummary: string) =>
  `Write a PM feature brief for the following product signal from account "${accountName}".

ACCOUNT CONTEXT: ${accountSummary}

SIGNAL:
- Type: ${signal.type}
- Title: ${signal.title}
- Priority: ${signal.priority}
- Customer quote: "${signal.quote}"
- PM action noted: ${signal.pmAction}

Output ONLY this structure in markdown:

## Feature: ${signal.title}

**Problem**
[2-3 sentences describing the problem from the customer's perspective. Ground it in what they actually said.]

**Customer evidence**
> "${signal.quote}"
> — ${accountName}

**Proposed solution**
[Specific, scoped solution. One clear paragraph. What exactly gets built.]

**Priority rationale**
[Why this matters now. Reference the account risk, renewal timing, or competitive pressure if relevant.]

**Acceptance criteria**
- [ ] [specific, testable criterion]
- [ ] [specific, testable criterion]
- [ ] [specific, testable criterion]`

export async function POST(req: NextRequest) {
  try {
    const { signal, accountName, accountSummary } = await req.json() as {
      signal: ProductSignal
      accountName: string
      accountSummary: string
    }

    if (!signal || !accountName) {
      return new Response("Missing signal or accountName", { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return new Response("OPENROUTER_API_KEY not configured", { status: 503 })
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nectic.vercel.app",
        "X-Title": "Nectic - Feature Brief Generator",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        temperature: 0.2,
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT(signal, accountName, accountSummary) },
        ],
      }),
    })

    if (!response.ok || !response.body) {
      const err = await response.text()
      return new Response(`OpenRouter error: ${err}`, { status: 502 })
    }

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
