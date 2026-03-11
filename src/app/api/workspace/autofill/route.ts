import { NextRequest, NextResponse } from "next/server"
import { callAI } from "@/lib/ai-client"

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

async function fetchPage(url: string, timeoutMs = 6000): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Nectic/1.0; +https://nectic.vercel.app)",
        Accept: "text/html",
      },
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    return await res.text()
  } catch {
    clearTimeout(timeout)
    return null
  }
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

    // Fetch the homepage with a timeout
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

    // Crawl up to 2 additional pages for roadmap/changelog info
    const additionalPaths = ["/changelog", "/blog", "/updates", "/product", "/features"]
    const origin = `${parsedUrl.protocol}//${parsedUrl.hostname}`
    const candidateUrls = additionalPaths.map((path) => `${origin}${path}`)

    const additionalResults = await Promise.allSettled(
      candidateUrls.map((u) => fetchPage(u))
    )

    const additionalSources: string[] = []
    const additionalTexts: string[] = []

    for (let i = 0; i < additionalResults.length; i++) {
      if (additionalSources.length >= 2) break
      const result = additionalResults[i]
      if (result.status === "fulfilled" && result.value !== null) {
        additionalSources.push(candidateUrls[i])
        additionalTexts.push(stripHtml(result.value))
      }
    }

    // Extract meta description as a high-signal starting point
    const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
    const metaDesc = metaDescMatch?.[1] ?? ""

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const pageTitle = titleMatch?.[1]?.trim() ?? ""

    // Combine content across pages, cap total at 10000 chars
    const totalBudget = 10000
    const homepageText = stripHtml(html)
    const homepageCap = additionalTexts.length > 0 ? 6000 : totalBudget
    const additionalBudget = totalBudget - Math.min(homepageText.length, homepageCap)
    const perAdditionalCap = additionalTexts.length > 0
      ? Math.floor(additionalBudget / additionalTexts.length)
      : 0

    const combinedParts: string[] = [homepageText.slice(0, homepageCap)]
    for (let i = 0; i < additionalTexts.length; i++) {
      const label = `[From ${additionalSources[i]}]`
      combinedParts.push(`${label} ${additionalTexts[i].slice(0, perAdditionalCap)}`)
    }
    const combinedContent = combinedParts.join(" ").slice(0, totalBudget)

    const prompt = `You are extracting structured product information from a SaaS company website.

Page title: ${pageTitle}
Meta description: ${metaDesc}
Combined page content (homepage + additional pages, up to 10000 chars):
${combinedContent}

Extract ONLY what is clearly present in the content. Return a JSON object with exactly these four keys:

{
  "productDescription": "2-4 sentences: what the product does, who uses it, what problem it solves. Be specific and factual. No marketing superlatives.",
  "productStory": "One-sentence pitch starting with 'We help...' — concise and customer-facing. Capture who the customer is and what outcome they get.",
  "featureAreas": "Comma-separated list of the product's actual feature modules/capabilities. Only include features clearly mentioned in the content.",
  "roadmapFocus": "What the team is actively building or recently shipped, drawn from changelog, blog, what's new, or updates sections. Empty string if not found."
}

Rules:
- Do NOT invent information not present in the content
- Do NOT include pricing, testimonials, or company history
- productStory MUST start with the words 'We help'
- roadmapFocus should focus on recency — latest releases or upcoming items, not evergreen features
- If you cannot determine something clearly, use an empty string
- Return ONLY the JSON object, no markdown wrapper`

    let raw: string
    try {
      raw = await callAI({ system: "", user: prompt, maxTokens: 500, temperature: 0.1 })
    } catch {
      return NextResponse.json({ error: "AI extraction failed" }, { status: 502 })
    }

    let parsed: {
      productDescription?: string
      productStory?: string
      featureAreas?: string
      roadmapFocus?: string
    }
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 502 })
    }

    return NextResponse.json({
      productDescription: (parsed.productDescription ?? "").trim(),
      productStory: (parsed.productStory ?? "").trim(),
      featureAreas: (parsed.featureAreas ?? "").trim(),
      roadmapFocus: (parsed.roadmapFocus ?? "").trim(),
      source: parsedUrl.hostname,
      additionalSources: additionalSources.map((u) => new URL(u).hostname),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
