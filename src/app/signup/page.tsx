"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect old /signup to /auth/signup
export default function SignupRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/auth/signup")
  }, [router])
  
  return null
}
