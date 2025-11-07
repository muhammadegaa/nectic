/**
 * Demo/Test mode utilities - bypasses payment in development
 */

export const DEMO_MODE_ENABLED = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NODE_ENV === "development"

/**
 * Check if demo mode is enabled
 */
export function isDemoMode(): boolean {
  return DEMO_MODE_ENABLED
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

