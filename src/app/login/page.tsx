"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect old /login to /auth/login
export default function LoginRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/auth/login")
  }, [router])
  
  return null
}
