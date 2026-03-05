"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { initPostHog, capturePageview } from "@/lib/posthog"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initPostHog()
      initialized.current = true
    }
  }, [])

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")
    capturePageview(url)
  }, [pathname, searchParams])

  return <>{children}</>
}
