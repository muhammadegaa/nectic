/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

// Only use Sentry if the package is installed
let config = nextConfig
try {
  const { withSentryConfig } = require("@sentry/nextjs")
  const sentryEnabled = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  if (sentryEnabled) {
    config = withSentryConfig(nextConfig, { silent: true }, { hideSourceMaps: true })
  }
} catch (e) {
  // Sentry not installed, use default config
}

module.exports = config
