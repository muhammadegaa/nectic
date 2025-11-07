/**
 * Demo/Test mode utilities - bypasses payment for testing
 * 
 * Enable in production by setting: NEXT_PUBLIC_DEMO_MODE=true
 * This allows testing checkout flows without processing real payments
 */

// Check both server and client side
const getDemoModeEnv = () => {
  // Explicit demo mode flag (works in any environment)
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return true
  }
  
  // Development mode auto-enables demo mode
  if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_MODE === "development") {
    return true
  }
  
  return false
}

export const DEMO_MODE_ENABLED = getDemoModeEnv()

/**
 * Check if demo mode is enabled
 */
export function isDemoMode(): boolean {
  const enabled = getDemoModeEnv()
  const isProduction = process.env.NODE_ENV === "production"
  
  if (typeof window !== "undefined") {
    console.log("[DEMO MODE] Client check:", {
      NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
      NODE_ENV: process.env.NODE_ENV,
      enabled,
      isProduction
    })
    
    // Warn if demo mode is enabled in production
    if (enabled && isProduction) {
      console.warn("⚠️ [DEMO MODE] Demo mode is ENABLED in PRODUCTION. Payment processing is DISABLED.")
    }
  } else if (enabled && isProduction) {
    // Server-side warning
    console.warn("⚠️ [DEMO MODE] Demo mode is ENABLED in PRODUCTION. Payment processing is DISABLED.")
  }
  
  return enabled
}

/**
 * Get demo subscription data for testing
 */
export function getDemoSubscription(plan: "standard" | "premium" = "premium") {
  return {
    tier: plan,
    status: "active",
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    cancelAtPeriodEnd: false,
  }
}

/**
 * Check if we should bypass Stripe in demo mode
 */
export function shouldBypassPayment(): boolean {
  return isDemoMode()
}

