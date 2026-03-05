"use client"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let posthog: any = null
let initialized = false

async function getPostHog() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null
  if (typeof window === "undefined") return null
  if (!posthog) {
    try {
      const mod = await import("posthog-js")
      posthog = mod.default
    } catch {
      return null
    }
  }
  return posthog
}

export async function initPostHog() {
  if (initialized) return
  const ph = await getPostHog()
  if (!ph) return
  ph.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    capture_pageview: false,
    persistence: "localStorage",
  })
  initialized = true
}

export async function trackEvent(event: string, properties?: Record<string, unknown>) {
  const ph = await getPostHog()
  if (!ph?.__loaded) return
  ph.capture(event, properties)
}

export async function identifyUser(userId: string, traits?: Record<string, unknown>) {
  const ph = await getPostHog()
  if (!ph?.__loaded) return
  ph.identify(userId, traits)
}

export async function capturePageview(url: string) {
  const ph = await getPostHog()
  if (!ph?.__loaded) return
  ph.capture("$pageview", { $current_url: url })
}
