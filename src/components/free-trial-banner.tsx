"use client"

import { AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { getFreeTrialStatus } from "@/lib/free-trial"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

export function FreeTrialBanner() {
  const { user } = useAuth()
  const trialStatus = getFreeTrialStatus(user)

  if (!trialStatus.isActive) {
    return null
  }

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900">Free Trial Active</AlertTitle>
      <AlertDescription className="text-amber-800">
        <div className="flex items-center justify-between">
          <span>
            You have {trialStatus.daysRemaining} day{trialStatus.daysRemaining !== 1 ? "s" : ""} remaining in your free trial.
            Explore all features without payment.
          </span>
          <Link href="/#pricing">
            <Button variant="outline" size="sm" className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100">
              Upgrade
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  )
}

