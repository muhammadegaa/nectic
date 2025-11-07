"use client"

import posthog from "posthog-js"

export type AnalyticsPayload = Record<string, unknown>

export function trackEvent(eventName: string, properties?: AnalyticsPayload) {
  if (typeof window === "undefined") {
    return
  }

  if (posthog?.capture) {
    posthog.capture(eventName, properties)
  } else if (process.env.NODE_ENV === "development") {
    console.info(`[analytics] ${eventName}`, properties)
  }
}

export function identifyUser(id: string, properties?: AnalyticsPayload) {
  if (typeof window === "undefined") {
    return
  }

  if (posthog?.identify) {
    posthog.identify(id, properties)
  }
}

export function resetUser() {
  if (typeof window === "undefined") {
    return
  }

  if (posthog?.reset) {
    posthog.reset()
  }
}
