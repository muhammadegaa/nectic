const { withSentryConfig } = require("@sentry/nextjs")

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

const sentryEnabled = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

module.exports = sentryEnabled
  ? withSentryConfig(nextConfig, { silent: true }, { hideSourceMaps: true })
  : nextConfig
