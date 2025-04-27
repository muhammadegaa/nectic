export type FeatureFlagTarget = "global" | "role" | "user"

export type FeatureFlagStatus = "enabled" | "disabled" | "percentage"

export interface FeatureFlag {
  id: string
  name: string
  description: string
  status: FeatureFlagStatus
  target: FeatureFlagTarget
  targetValue?: string | string[] // Role name, user ID, or null for global
  percentage?: number // For percentage rollouts
  createdAt: any // Timestamp
  updatedAt: any // Timestamp
  createdBy: string // User ID
}

export interface FeatureFlagContextType {
  flags: Record<string, boolean>
  isLoading: boolean
  refreshFlags: () => Promise<void>
  hasFeature: (featureId: string) => boolean
}
