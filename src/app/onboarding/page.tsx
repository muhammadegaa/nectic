"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect old /onboarding to /dashboard
export default function OnboardingRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/dashboard")
  }, [router])
  
  return null
}
