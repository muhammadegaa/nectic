"use client"

import type { ReactNode } from "react"
import { useFeatureFlags } from "@/contexts/feature-flag-context"

interface FeatureFlagProps {
  feature: string
  children: ReactNode
  fallback?: ReactNode
}

export function FeatureFlag({ feature, children, fallback }: FeatureFlagProps) {
  const { hasFeature, isLoading } = useFeatureFlags()

  // If still loading flags, don't render anything yet
  if (isLoading) return null

  // If feature is enabled, render children
  if (hasFeature(feature)) {
    return <>{children}</>
  }

  // Otherwise render fallback or null
  return fallback ? <>{fallback}</> : null
}
