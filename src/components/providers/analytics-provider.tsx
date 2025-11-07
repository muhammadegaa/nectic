"use client"

import { ReactNode, useEffect } from "react"
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"

declare global {
  interface Window {
    __posthogInitialized?: boolean
  }
}

interface AnalyticsProviderProps {
  children: ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com"

  useEffect(() => {
    if (typeof window === "undefined" || !apiKey) {
      return
    }

    if (window.__posthogInitialized) {
      return
    }

    posthog.init(apiKey, {
      api_host: apiHost,
      autocapture: false,
      capture_pageview: false,
    })

    window.__posthogInitialized = true
  }, [apiKey, apiHost])

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[analytics] PostHog key not provided; analytics disabled")
    }

    return <>{children}</>
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
