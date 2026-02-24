/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ]
  },
}

const sentryEnabled = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

// Only use Sentry if enabled and module is available
if (sentryEnabled) {
  try {
    const { withSentryConfig } = require("@sentry/nextjs")
    module.exports = withSentryConfig(nextConfig, { 
      silent: true,
      hideSourceMaps: true,
      disableServerWebpackPlugin: false,
      disableClientWebpackPlugin: false,
    })
  } catch (error) {
    // Sentry not installed, use default config
    module.exports = nextConfig
  }
} else {
  module.exports = nextConfig
}
