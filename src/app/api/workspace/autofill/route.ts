import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 30

function stripHtml(html: string): string {
  // Remove script, style, nav, footer, header blocks entirely
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, " ")
  // Collapse whitespace and decode common HTML entities
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json() as { url?: string }

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    // Fetch the page with a timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    let html: string
    try {
      const res = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Nectic/1.0; +https://nectic.vercel.app)",
          Accept: "text/html",
        },
      })
      clearTimeout(timeout)
      if (!res.ok) {
        return NextResponse.json({ error: `Site returned ${res.status}` }, { status: 422 })
      }
      html = await res.text()
    } catch (err) {
      clearTimeout(timeout)
      const msg = err instanceof Error && err.name === "AbortError"
        ? "Site took too long to respond"
        : "Could not reach the URL"
      return NextResponse.json({ error: msg }, { status: 422 })
    }

    // Extract meta description as a high-signal starting point
    const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
    const metaDesc = metaDescMatch?.[1] ?? ""

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const pageTitle = titleMatch?.[1]?.trim() ?? ""

    // Keep first 6000 chars of stripped text — enough context without blowing token budget
    const bodyText = stripHtml(html).slice(0, 6000)

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    }

    const prompt = `You are extracting structured product information from a SaaS company website.

Page title: ${pageTitle}
Meta description: ${metaDesc}
Page content (first 6000 chars):
${bodyText}

Extract ONLY what is clearly present on this page. Return a JSON object with exactly these two keys:

{
  "productDescription": "2-4 sentences: what the product does, who uses it, what problem it solves. Be specific and factual. No marketing superlatives.",
  "featureAreas": "Comma-separated list of the product's actual feature modules/capabilities. Only include features clearly mentioned on the page."
}

Rules:
- Do NOT invent information not present on the page
- Do NOT include pricing, testimonials, or company history
- If you cannot determine something clearly, use an empty string
- Return ONLY the JSON object, no markdown wrapper`

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nectic.vercel.app",
        "X-Title": "Nectic - Workspace Autofill",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.6",
        temperature: 0.1,
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!aiRes.ok) {
      return NextResponse.json({ error: "AI extraction failed" }, { status: 502 })
    }

    const aiData = await aiRes.json()
    const raw = aiData.choices?.[0]?.message?.content ?? ""

    let parsed: { productDescription?: string; featureAreas?: string }
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 502 })
    }

    return NextResponse.json({
      productDescription: (parsed.productDescription ?? "").trim(),
      featureAreas: (parsed.featureAreas ?? "").trim(),
      source: parsedUrl.hostname,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
