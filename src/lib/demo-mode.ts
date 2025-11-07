/**
 * Demo/Test mode utilities - bypasses payment in development
 */

// Check both server and client side
const getDemoModeEnv = () => {
  if (typeof window !== "undefined") {
    // Client side
    return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || 
           process.env.NEXT_PUBLIC_DEMO_MODE === "development" ||
           process.env.NODE_ENV === "development"
  } else {
    // Server side
    return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || 
           process.env.NEXT_PUBLIC_DEMO_MODE === "development" ||
           process.env.NODE_ENV === "development"
  }
}

export const DEMO_MODE_ENABLED = getDemoModeEnv()

/**
 * Check if demo mode is enabled
 */
export function isDemoMode(): boolean {
  const enabled = getDemoModeEnv()
  if (typeof window !== "undefined") {
    console.log("[DEMO MODE] Client check:", {
      NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
      NODE_ENV: process.env.NODE_ENV,
      enabled
    })
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

