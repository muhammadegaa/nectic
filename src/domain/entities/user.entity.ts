/**
 * Domain Entity: User
 * Pure business logic - no framework dependencies
 */

export interface UserProfile {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: Date
  updatedAt: Date
  hasCompletedAssessment: boolean
  subscriptionTier: 'free' | 'premium'
  subscriptionStatus?: 'active' | 'canceled' | 'past_due'
  stripeCustomerId?: string
}

export interface UserPreferences {
  userId: string
  notificationsEnabled: boolean
  emailUpdates: boolean
}















