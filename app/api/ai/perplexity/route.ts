import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Get API key from environment variables
    const apiKey = process.env.PERPLEXITY_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Perplexity API key not configured" }, { status: 500 })
    }

    // Parse request body
    const body = await request.json()
    const { prompt, model = "mixtral-8x7b-instruct" } = body // Updated default model to a valid one

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Call Perplexity API
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant specializing in business automation and AI opportunities.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Perplexity API error:", errorData)
      return NextResponse.json(
        { error: `Perplexity API returned ${response.status}: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Extract the response text
    const responseText = data.choices?.[0]?.message?.content || ""

    return NextResponse.json({ response: responseText })
  } catch (error) {
    console.error("Error in Perplexity API route:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
