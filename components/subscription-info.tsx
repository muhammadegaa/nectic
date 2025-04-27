"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Calendar } from "lucide-react"
import { useState } from "react"

export function SubscriptionInfo() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  if (!user) return null

  const getPlanBadge = () => {
    switch (user.subscription.tier) {
      case "premium":
        return <Badge className="bg-amber-100 text-amber-800">Premium</Badge>
      case "standard":
        return <Badge className="bg-blue-100 text-blue-800">Standard</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Free</Badge>
    }
  }

  const formatExpiryDate = () => {
    if (!user.subscription.expiresAt) return "Never"
    return user.subscription.expiresAt.toDate().toLocaleDateString()
  }

  const handleManageSubscription = async () => {
    if (!user.subscription.stripeCustomerId) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: user.subscription.stripeCustomerId }),
      })

      if (!response.ok) {
        throw new Error("Failed to create portal session")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Error creating portal session:", error)
    } finally {
      setIsLoading(false)
    }
  }

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

          {user.subscription.expiresAt && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Expires</span>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                {formatExpiryDate()}
              </div>
            </div>
          )}

          {user.subscription.tier === "free" && (
            <Button asChild className="w-full mt-4">
              <a href="/checkout?plan=standard">Upgrade to Standard</a>
            </Button>
          )}

          {user.subscription.tier === "standard" && (
            <Button asChild className="w-full mt-4">
              <a href="/checkout?plan=premium">Upgrade to Premium</a>
            </Button>
          )}

          {user.subscription.tier !== "free" && (
            <Button onClick={handleManageSubscription} variant="outline" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Loading..." : "Manage Subscription"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
