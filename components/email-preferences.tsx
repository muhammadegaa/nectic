"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Mail, CreditCard, Receipt, Bell } from "lucide-react"

export function EmailPreferences() {
  const { user, updateUserProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Default preferences if not set in user profile
  const defaultPreferences = {
    receiveInvoices: true,
    receiveReceipts: true,
    receivePaymentReminders: true,
    receiveProductUpdates: true,
  }

  // Get preferences from user profile or use defaults
  const preferences = user?.emailPreferences || defaultPreferences

  const [emailPreferences, setEmailPreferences] = useState({
    receiveInvoices: preferences.receiveInvoices,
    receiveReceipts: preferences.receiveReceipts,
    receivePaymentReminders: preferences.receivePaymentReminders,
    receiveProductUpdates: preferences.receiveProductUpdates,
  })

  const handleToggleChange = (preference: keyof typeof emailPreferences) => {
    setEmailPreferences((prev) => ({
      ...prev,
      [preference]: !prev[preference],
    }))
  }

  const handleSavePreferences = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await updateUserProfile({
        emailPreferences: emailPreferences,
      } as any)

      // Update Stripe customer preferences via API
      await fetch("/api/update-email-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: user.subscription.stripeCustomerId,
          preferences: emailPreferences,
        }),
      })

      toast({
        title: "Preferences Updated",
        description: "Your email preferences have been saved.",
      })
    } catch (error) {
      console.error("Error saving email preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-amber-500" />
          Email Preferences
        </CardTitle>
        <CardDescription>Manage the emails you receive from us</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="h-4 w-4 text-gray-500" />
              <Label htmlFor="receive-invoices" className="font-medium">
                Invoices & Receipts
              </Label>
            </div>
            <Switch
              id="receive-invoices"
              checked={emailPreferences.receiveInvoices}
              onCheckedChange={() => handleToggleChange("receiveInvoices")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <Label htmlFor="receive-payment-reminders" className="font-medium">
                Payment Reminders
              </Label>
            </div>
            <Switch
              id="receive-payment-reminders"
              checked={emailPreferences.receivePaymentReminders}
              onCheckedChange={() => handleToggleChange("receivePaymentReminders")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-gray-500" />
              <Label htmlFor="receive-product-updates" className="font-medium">
                Product Updates
              </Label>
            </div>
            <Switch
              id="receive-product-updates"
              checked={emailPreferences.receiveProductUpdates}
              onCheckedChange={() => handleToggleChange("receiveProductUpdates")}
            />
          </div>

          <Button onClick={handleSavePreferences} className="w-full mt-4" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Preferences"}
          </Button>

          <p className="text-xs text-gray-500 mt-2">
            Note: You will still receive important account notifications and security alerts regardless of these
            settings.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
