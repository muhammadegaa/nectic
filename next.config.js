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
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.app https://vercel.live https://js.stripe.com https://app.posthog.com https://eu.posthog.com https://us-assets.i.posthog.com https://apis.google.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://openrouter.ai https://api.stripe.com https://app.posthog.com https://eu.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://eu-app-api.wati.io https://accounts.google.com wss://*.firebaseio.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com https://*.firebaseapp.com",
              "worker-src 'self' blob:",
            ].join('; ')
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
