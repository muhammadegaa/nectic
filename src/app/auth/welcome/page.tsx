"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect /auth/welcome to /dashboard
export default function WelcomeRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/dashboard")
  }, [router])
  
  return null
}
