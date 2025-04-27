import { Timestamp } from "./firebase-client"
import type { FeatureFlag } from "./feature-flag-types"
import type { User } from "@/contexts/auth-context"

// Mock storage for development
const mockFeatureFlags: Record<string, FeatureFlag> = {
  "premium-analytics": {
    id: "premium-analytics",
    name: "Premium Analytics",
    description: "Advanced analytics features for premium users",
    status: "enabled",
    target: "role",
    targetValue: ["premium"],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: "system",
  },
  "beta-ai-recommendations": {
    id: "beta-ai-recommendations",
    name: "AI Recommendations",
    description: "AI-powered recommendations for opportunities",
    status: "percentage",
    target: "global",
    percentage: 50,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: "system",
  },
  "vendor-marketplace": {
    id: "vendor-marketplace",
    name: "Vendor Marketplace",
    description: "Marketplace for AI vendors",
    status: "disabled",
    target: "global",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: "system",
  },
  "team-collaboration": {
    id: "team-collaboration",
    name: "Team Collaboration",
    description: "Enhanced team collaboration features",
    status: "enabled",
    target: "global",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: "system",
  },
}

export const featureFlagService = {
  // Get all feature flags
  getAllFlags: async (): Promise<FeatureFlag[]> => {
    // In a real implementation, this would fetch from Firestore
    return Object.values(mockFeatureFlags)
  },

  // Get a specific feature flag
  getFlag: async (id: string): Promise<FeatureFlag | null> => {
    // In a real implementation, this would fetch from Firestore
    return mockFeatureFlags[id] || null
  },

  // Create a new feature flag
  createFlag: async (flag: Omit<FeatureFlag, "id" | "createdAt" | "updatedAt">): Promise<FeatureFlag> => {
    const id = flag.name.toLowerCase().replace(/\s+/g, "-")
    const newFlag: FeatureFlag = {
      ...flag,
      id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    // In a real implementation, this would save to Firestore
    mockFeatureFlags[id] = newFlag
    return newFlag
  },

  // Update a feature flag
  updateFlag: async (
    id: string,
    updates: Partial<Omit<FeatureFlag, "id" | "createdAt" | "createdBy">>,
  ): Promise<FeatureFlag> => {
    // In a real implementation, this would update in Firestore
    if (!mockFeatureFlags[id]) {
      throw new Error(`Feature flag with ID ${id} not found`)
    }

    mockFeatureFlags[id] = {
      ...mockFeatureFlags[id],
      ...updates,
      updatedAt: Timestamp.now(),
    }

    return mockFeatureFlags[id]
  },

  // Delete a feature flag
  deleteFlag: async (id: string): Promise<void> => {
    // In a real implementation, this would delete from Firestore
    if (mockFeatureFlags[id]) {
      delete mockFeatureFlags[id]
    }
  },

  // Evaluate if a feature is enabled for a specific user
  evaluateFlag: (flag: FeatureFlag, user: User | null): boolean => {
    // If the flag is disabled, return false
    if (flag.status === "disabled") return false

    // If the flag is enabled globally, return true
    if (flag.status === "enabled" && flag.target === "global") return true

    // If the flag is enabled for specific roles
    if (flag.status === "enabled" && flag.target === "role" && user) {
      const userRole = user.subscription.tier
      return Array.isArray(flag.targetValue) ? flag.targetValue.includes(userRole) : flag.targetValue === userRole
    }

    // If the flag is enabled for specific users
    if (flag.status === "enabled" && flag.target === "user" && user) {
      return Array.isArray(flag.targetValue) ? flag.targetValue.includes(user.uid) : flag.targetValue === user.uid
    }

    // If the flag is enabled for a percentage of users
    if (flag.status === "percentage" && flag.percentage !== undefined) {
      // Use a deterministic approach based on user ID or a random number
      const randomValue = user ? hashStringToNumber(user.uid) % 100 : Math.floor(Math.random() * 100)

      return randomValue < flag.percentage
    }

    return false
  },

  // Get all enabled features for a user
  getUserEnabledFeatures: async (user: User | null): Promise<Record<string, boolean>> => {
    const allFlags = await featureFlagService.getAllFlags()

    return allFlags.reduce(
      (acc, flag) => {
        acc[flag.id] = featureFlagService.evaluateFlag(flag, user)
        return acc
      },
      {} as Record<string, boolean>,
    )
  },
}

// Helper function to hash a string to a number (for deterministic percentage rollouts)
function hashStringToNumber(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}
