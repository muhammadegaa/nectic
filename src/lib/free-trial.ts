/**
 * Free trial utilities - allows users to test core features without payment
 */

export const FREE_TRIAL_DURATION_DAYS = 14
export const FREE_TRIAL_FEATURES = [
  "assessment",
  "view_opportunities",
  "view_roi",
  "view_implementation_preview",
] as const

export type FreeTrialFeature = typeof FREE_TRIAL_FEATURES[number]

export interface FreeTrialStatus {
  isActive: boolean
  daysRemaining: number
  expiresAt: Date | null
}

/**
 * Check if user has active free trial
 */
export function hasActiveFreeTrial(user: any): boolean {
  if (!user) return false
  
  // Check if user has completed signup recently (within trial period)
  const createdAt = user.createdAt
  if (!createdAt) return false
  
  const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt)
  const daysSinceSignup = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
  
  return daysSinceSignup <= FREE_TRIAL_DURATION_DAYS
}

/**
 * Get free trial status for user
 */
export function getFreeTrialStatus(user: any): FreeTrialStatus {
  if (!user) {
    return { isActive: false, daysRemaining: 0, expiresAt: null }
  }
  
  const createdAt = user.createdAt
  if (!createdAt) {
    return { isActive: false, daysRemaining: 0, expiresAt: null }
  }
  
  const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt)
  const expiresAt = new Date(createdDate.getTime() + FREE_TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)
  const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  const isActive = daysRemaining > 0 && !user.subscription?.tier
  
  return { isActive, daysRemaining, expiresAt }
}

/**
 * Check if user can access a feature (free trial or paid)
 */
export function canAccessFeature(user: any, feature: FreeTrialFeature): boolean {
  if (!user) return false
  
  // Paid users can access everything
  if (user.subscription?.tier === "premium" || user.subscription?.tier === "standard") {
    return true
  }
  
  // Free trial users can access trial features
  if (hasActiveFreeTrial(user)) {
    return FREE_TRIAL_FEATURES.includes(feature)
  }
  
  return false
}

