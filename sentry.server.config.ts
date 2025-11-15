try {
  const Sentry = require("@sentry/nextjs")

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    })
  }
} catch (e) {
  // Sentry not installed
}
