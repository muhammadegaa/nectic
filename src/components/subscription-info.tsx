"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Calendar } from "lucide-react"

export function SubscriptionInfo() {
  const { user } = useAuth()
  const subscription = (user as any)?.subscription

  const formatTimestamp = (value: unknown): string | null => {
    if (!value) {
      return null
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toLocaleDateString()
    }

    if (typeof value === "number") {
      return new Date(value * 1000).toLocaleDateString()
    }

    if (typeof value === "string") {
      const numeric = Number(value)
      if (!Number.isNaN(numeric)) {
        return new Date(numeric * 1000).toLocaleDateString()
      }
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString()
    }

    if (typeof value === "object") {
      const maybeTimestamp = value as { seconds?: number; _seconds?: number; toDate?: () => Date }
      if (typeof maybeTimestamp.seconds === "number") {
        return new Date(maybeTimestamp.seconds * 1000).toLocaleDateString()
      }
      if (typeof maybeTimestamp._seconds === "number") {
        return new Date(maybeTimestamp._seconds * 1000).toLocaleDateString()
      }
      if (typeof maybeTimestamp.toDate === "function") {
        const date = maybeTimestamp.toDate()
        return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : null
      }
    }

    return null
  }

  const tier = subscription?.tier ?? "free"
  const expiresAt = formatTimestamp(subscription?.expiresAt)

  if (!user) return null

  const getPlanBadge = () => {
    switch (tier) {
      case "premium":
        return <Badge className="bg-amber-100 text-amber-800">Premium</Badge>
      case "standard":
        return <Badge className="bg-blue-100 text-blue-800">Standard</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Free</Badge>
    }
  }

  const formatExpiryDate = () => expiresAt ?? "Never"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Subscription
        </CardTitle>
        <CardDescription>Your current subscription plan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Current Plan</span>
            <div>{getPlanBadge()}</div>
          </div>

          {expiresAt && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Expires</span>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                {formatExpiryDate()}
              </div>
            </div>
          )}

          {tier === "free" && (
            <Button asChild className="w-full mt-4">
              <a href="/checkout?plan=standard">Upgrade to Standard</a>
            </Button>
          )}

          {tier === "standard" && (
            <Button asChild className="w-full mt-4">
              <a href="/checkout?plan=premium">Upgrade to Premium</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
