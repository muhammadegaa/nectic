"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { featureFlagService } from "@/lib/feature-flag-service"
import { useAuth } from "./auth-context"
import type { FeatureFlagContextType } from "@/lib/feature-flag-types"

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined)

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  const loadFlags = async () => {
    try {
      setIsLoading(true)
      const enabledFeatures = await featureFlagService.getUserEnabledFeatures(user)
      setFlags(enabledFeatures)
    } catch (error) {
      console.error("Error loading feature flags:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load flags when the user changes
  useEffect(() => {
    loadFlags()
  }, [user?.uid])

  const hasFeature = (featureId: string): boolean => {
    return !!flags[featureId]
  }

  const value: FeatureFlagContextType = {
    flags,
    isLoading,
    refreshFlags: loadFlags,
    hasFeature,
  }

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>
}

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext)
  if (context === undefined) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagProvider")
  }
  return context
}
