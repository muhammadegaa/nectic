import { NextRequest } from "next/server"

export const maxDuration = 60

type RoadmapStatus = "new" | "planned" | "partial" | "unknown"

interface WorkspaceContext {
  productDescription?: string
  featureAreas?: string
  roadmapFocus?: string
  knownIssues?: string
}

interface ProductSignal {
  type: string
  title: string
  problemStatement?: string
  quote: string
  priority: string
  pmAction: string
}

const SYSTEM_PROMPT = `You are a senior product manager writing a feature brief. Output clean, structured markdown. Be specific — ground every claim in the customer evidence provided. Do not add preamble or explanation outside the brief structure.`

const USER_PROMPT = (
  signal: ProductSignal,
  accountName: string,
  accountSummary: string,
  roadmapStatus: RoadmapStatus,
  additionalContext: string,
  workspace?: WorkspaceContext
) => {
  const workspaceBlock = workspace ? [
    workspace.productDescription && `Product: ${workspace.productDescription}`,
    workspace.featureAreas && `Feature areas: ${workspace.featureAreas}`,
    workspace.roadmapFocus && `Roadmap this quarter: ${workspace.roadmapFocus}`,
    workspace.knownIssues && `Known issues: ${workspace.knownIssues}`,
  ].filter(Boolean).join("\n") : ""

  const roadmapNote = {
    new: "This is not on the roadmap. The brief should include a discovery validation section — what to confirm before committing to build.",
    planned: "This is already planned. The brief should focus on implementation scope, acceptance criteria, and ensuring the build actually addresses the root problem the customer described.",
    partial: "Something similar is planned but this specific problem may not be fully addressed. The brief should highlight the gap between what's planned and what the customer actually needs.",
    unknown: "Roadmap status is unknown. Include both a discovery validation section and an initial implementation scope.",
  }[roadmapStatus]

  return `Write a PM feature brief for the following product signal from account "${accountName}".
${workspaceBlock ? `\nWORKSPACE CONTEXT:\n${workspaceBlock}\n` : ""}
ACCOUNT CONTEXT: ${accountSummary}
ROADMAP STATUS: ${roadmapNote}
${additionalContext ? `ADDITIONAL CONTEXT FROM PM: ${additionalContext}\n` : ""}
SIGNAL:
- Type: ${signal.type}
- Title: ${signal.title}
${signal.problemStatement ? `- Underlying problem: ${signal.problemStatement}` : ""}
- Priority: ${signal.priority}
- Customer quote: "${signal.quote}"
- PM action noted: ${signal.pmAction}

Output ONLY this structure in markdown:

## ${signal.title}

**Problem (Jobs to be Done framing)**
[2-3 sentences. What job is the customer trying to get done? The quote is a solution proposal — articulate the underlying need. Ground it in what they actually said.]

**Customer evidence**
> "${signal.quote}"
> — ${accountName}

**What we know vs. what we're assuming**
- Know: [what the signal clearly tells us]
- Assuming: [what we're inferring that needs validation]
- Don't know yet: [what to confirm before building]

${roadmapStatus === "planned" || roadmapStatus === "partial" ? `**Gap analysis**
[If similar work is planned, what specifically does this signal reveal that the current plan may miss?]

` : `**Validation before building**
- [ ] [specific thing to confirm with the customer or via data]
- [ ] [specific thing to confirm]

`}**Proposed solution**
[Specific, scoped solution. One clear paragraph. What exactly gets built — not a feature wish list.]

**Acceptance criteria**
- [ ] [specific, testable criterion]
- [ ] [specific, testable criterion]
- [ ] [specific, testable criterion]

**Priority rationale**
[Why this matters now relative to other work. Reference account risk level, renewal timing, or competitive pressure if relevant. Be honest about trade-offs.]`
}

export async function POST(req: NextRequest) {
  try {
    const {
      signal,
      accountName,
      accountSummary,
      roadmapStatus = "unknown",
      additionalContext = "",
      workspace,
    } = await req.json() as {
      signal: ProductSignal
      accountName: string
      accountSummary: string
      roadmapStatus?: RoadmapStatus
      additionalContext?: string
      workspace?: WorkspaceContext
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
        model: "anthropic/claude-sonnet-4.6",
        temperature: 0.2,
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT(signal, accountName, accountSummary, roadmapStatus, additionalContext, workspace) },
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
          if (done) { await writer.close(); break }
          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const parsed = JSON.parse(data)
              const token = parsed.choices?.[0]?.delta?.content
              if (token) await writer.write(new TextEncoder().encode(token))
            } catch { /* skip malformed */ }
          }
        }
      } catch { await writer.abort() }
    })()

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    })
  } catch (err: unknown) {
    return new Response(err instanceof Error ? err.message : "Unknown error", { status: 500 })
  }
}
