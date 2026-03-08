// ─── Shared AI client ────────────────────────────────────────────────────────
// Uses Anthropic API directly if ANTHROPIC_API_KEY is set (fast, no overhead).
// Falls back to OpenRouter with google/gemini-3.1-flash-lite-preview (fast).
// All callers receive a plain string response.

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001"
const OPENROUTER_MODEL = "google/gemini-3.1-flash-lite-preview"

export interface Message {
  role: "user" | "assistant"
  content: string
}

export interface AICallOptions {
  system: string
  user?: string
  messages?: Message[] // use for multi-turn; if provided, overrides user
  maxTokens?: number
  temperature?: number
}

export async function callAI(opts: AICallOptions): Promise<string> {
  const { system, user, messages, maxTokens = 4096, temperature = 0.2 } = opts
  const msgs: Message[] = messages ?? [{ role: "user", content: user ?? "" }]

  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: msgs,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic API error: ${err}`)
    }
    const data = await res.json()
    const text = data.content?.[0]?.text
    if (!text) throw new Error("Empty response from Anthropic")
    return text
  }

  // OpenRouter fallback
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("No AI API key configured (ANTHROPIC_API_KEY or OPENROUTER_API_KEY)")

  const orMessages = system
    ? [{ role: "system", content: system }, ...msgs]
    : [...msgs]

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nectic.vercel.app",
      "X-Title": "Nectic",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature,
      messages: orMessages,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error: ${err}`)
  }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error("Empty response from OpenRouter")
  return text
}

// Streaming version — returns the raw fetch response for SSE passthrough
export async function callAIStream(opts: AICallOptions): Promise<Response> {
  const { system, user, messages, maxTokens = 2048, temperature = 0.2 } = opts
  const msgs: Message[] = messages ?? [{ role: "user", content: user ?? "" }]

  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        temperature,
        stream: true,
        system,
        messages: msgs,
      }),
    })
    return res
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("No AI API key configured")

  const orMessages = system
    ? [{ role: "system", content: system }, ...msgs]
    : [...msgs]

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nectic.vercel.app",
      "X-Title": "Nectic",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature,
      stream: true,
      messages: orMessages,
    }),
  })
  return res
}

// Extract a text token from an SSE line — handles both Anthropic and OpenRouter formats
export function extractStreamToken(line: string): string | null {
  if (!line.startsWith("data: ")) return null
  const data = line.slice(6).trim()
  if (data === "[DONE]") return null
  try {
    const parsed = JSON.parse(data)
    // Anthropic: content_block_delta
    if (parsed.delta?.text) return parsed.delta.text
    // OpenRouter / OpenAI: choices delta
    if (parsed.choices?.[0]?.delta?.content) return parsed.choices[0].delta.content
  } catch { /* skip malformed */ }
  return null
}
