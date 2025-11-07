"use client"

import { isDemoMode } from "@/lib/demo-mode"
import { AlertCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DemoModeBanner() {
  if (!isDemoMode()) {
    return null
  }

  const isProduction = process.env.NODE_ENV === "production"
  const Icon = isProduction ? AlertTriangle : AlertCircle
  const bgColor = isProduction ? "bg-red-50 border-red-300" : "bg-amber-50 border-amber-300"
  const textColor = isProduction ? "text-red-900" : "text-amber-900"
  const descColor = isProduction ? "text-red-800" : "text-amber-800"

  return (
    <Alert className={`fixed top-16 left-0 right-0 z-50 ${bgColor} shadow-lg rounded-none`}>
      <Icon className={`h-4 w-4 ${isProduction ? "text-red-600" : "text-amber-600"}`} />
      <AlertTitle className={`${textColor} font-semibold`}>
        {isProduction ? "⚠️ PRODUCTION: Demo Mode Active" : "🎯 Demo Mode Active"}
      </AlertTitle>
      <AlertDescription className={`${descColor} text-sm`}>
        {isProduction ? (
          <>
            <strong>WARNING:</strong> Payment processing is DISABLED. All checkout flows bypass Stripe.
            <span className="block mt-1 text-xs">
              Set NEXT_PUBLIC_DEMO_MODE=false to disable demo mode in production.
            </span>
          </>
        ) : (
          <>
            Payment processing is disabled. All checkout flows will bypass Stripe.
            {process.env.NEXT_PUBLIC_DEMO_MODE && (
              <span className="ml-2 text-xs">(NEXT_PUBLIC_DEMO_MODE={process.env.NEXT_PUBLIC_DEMO_MODE})</span>
            )}
          </>
        )}
      </AlertDescription>
    </Alert>
  )
}

