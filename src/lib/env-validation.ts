// Environment variable validation
// Call this at app startup to ensure all required env vars are set

export function validateEnvVars() {
  const required = {
    // Firebase
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

    // Stripe
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_STANDARD_PRICE_ID: process.env.STRIPE_STANDARD_PRICE_ID,
    STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID,
  }

  const missing: string[] = []

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`
    console.error('❌', error)
    if (process.env.NODE_ENV === 'production') {
      throw new Error(error)
    }
    return false
  }

  // Optional but recommended
  if (!process.env.PERPLEXITY_API_KEY) {
    console.warn('⚠️  PERPLEXITY_API_KEY not set - AI features will use fallback data')
  }

  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    console.warn('⚠️  NEXT_PUBLIC_BASE_URL not set - using default')
  }

  console.log('✅ All required environment variables are set')
  return true
}
