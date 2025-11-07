import * as Sentry from "@sentry/nextjs"

export type ErrorContext = Record<string, unknown>

export function reportError(error: unknown, context?: ErrorContext) {
  if (process.env.NODE_ENV === "development" && !process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.error("[error]", error, context)
    return
  }

  Sentry.captureException(error, {
    extra: context,
  })
}
