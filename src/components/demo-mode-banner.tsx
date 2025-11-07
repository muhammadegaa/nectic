"use client"

import { isDemoMode } from "@/lib/demo-mode"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DemoModeBanner() {
  if (!isDemoMode()) {
    return null
  }

  return (
    <Alert className="fixed top-16 left-0 right-0 z-50 border-amber-300 bg-amber-50 shadow-lg rounded-none">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900 font-semibold">🎯 Demo Mode Active</AlertTitle>
      <AlertDescription className="text-amber-800 text-sm">
        Payment processing is disabled. All checkout flows will bypass Stripe.
        {process.env.NEXT_PUBLIC_DEMO_MODE && (
          <span className="ml-2 text-xs">(NEXT_PUBLIC_DEMO_MODE={process.env.NEXT_PUBLIC_DEMO_MODE})</span>
        )}
      </AlertDescription>
    </Alert>
  )
}

