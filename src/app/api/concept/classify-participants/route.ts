import { NextRequest, NextResponse } from "next/server"
import { callAI } from "@/lib/ai-client"

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

    const participantBlock = participants
      .map((p) => {
        const sample = p.messages.slice(0, 5).join(" | ")
        return `${p.name}: "${sample}"`
      })
      .join("\n")

    let raw: string
    try {
      raw = await callAI({
        system: SYSTEM_PROMPT,
        user: `Classify these participants:\n\n${participantBlock}`,
        maxTokens: 300,
        temperature: 0,
      })
    } catch {
      return NextResponse.json({ roles: {} }, { status: 200 })
    }
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ roles: {} }, { status: 200 })

    const parsed = JSON.parse(jsonMatch[0]) as { roles: Record<string, ParticipantRole> }
    return NextResponse.json({ roles: parsed.roles ?? {} }, { status: 200 })
  } catch {
    // Classification is best-effort — never block the main flow
    return NextResponse.json({ roles: {} }, { status: 200 })
  }
}
