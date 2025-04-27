"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useFeatureFlags } from "@/contexts/feature-flag-context"

interface FeatureGateProps {
  feature: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function FeatureGate({ feature, fallback, children }: FeatureGateProps) {
  const { user } = useAuth()
  const { hasFeature, isLoading } = useFeatureFlags()

  // Check if the feature is enabled
  const isEnabled = hasFeature(feature)

  // If the feature is enabled, render the children
  if (isEnabled) {
    return <>{children}</>
  }

  // If the user is premium, enable all features
  if (user?.subscription?.tier === "premium") {
    return <>{children}</>
  }

  // If loading, show nothing (or could show a loading state)
  if (isLoading) {
    return null
  }

  // If the feature is not enabled and a fallback is provided, render the fallback
  if (fallback) {
    return <>{fallback}</>
  }

  // If no fallback is provided, render nothing
  return null
}
