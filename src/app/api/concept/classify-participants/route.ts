import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 20

type ParticipantRole = "vendor" | "customer" | "partner" | "other"

interface ParticipantSample {
  name: string
  messages: string[]
}

const SYSTEM_PROMPT = `You are classifying participants in a B2B WhatsApp group conversation.

Determine each participant's role based on their message patterns:
- "vendor": the SaaS/software company's team — CS, support, sales, technical. Clues: "produk kami", "kami akan fix", "tim kami", explains features, responds to issues, apologises for bugs
- "customer": the client company's team — end users, managers, decision makers. Clues: reports problems, asks how things work, "sistem kalian", expresses satisfaction or frustration, mentions internal processes
- "partner": reseller, implementation partner, or third-party intermediary. Clues: introduces themselves as reseller/partner, facilitates between vendor and customer
- "other": genuinely unclear from sample messages

Return ONLY valid JSON: { "roles": { "Name": "vendor"|"customer"|"partner"|"other" } }
No markdown, no explanation.`

export async function POST(req: NextRequest) {
  try {
    const { participants } = await req.json() as { participants: ParticipantSample[] }

    if (!participants?.length) {
      return NextResponse.json({ roles: {} }, { status: 200 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ roles: {} }, { status: 200 })
    }

    const participantBlock = participants
      .map((p) => {
        const sample = p.messages.slice(0, 5).join(" | ")
        return `${p.name}: "${sample}"`
      })
      .join("\n")

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nectic.vercel.app",
        "X-Title": "Nectic - Participant Classification",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        temperature: 0,
        max_tokens: 300,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Classify these participants:\n\n${participantBlock}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ roles: {} }, { status: 200 })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content ?? ""
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ roles: {} }, { status: 200 })

    const parsed = JSON.parse(jsonMatch[0]) as { roles: Record<string, ParticipantRole> }
    return NextResponse.json({ roles: parsed.roles ?? {} }, { status: 200 })
  } catch {
    // Classification is best-effort — never block the main flow
    return NextResponse.json({ roles: {} }, { status: 200 })
  }
}
