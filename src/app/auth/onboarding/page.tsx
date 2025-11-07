"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect /auth/onboarding to /dashboard
export default function AuthOnboardingRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/dashboard")
  }, [router])
  
  return null
}
