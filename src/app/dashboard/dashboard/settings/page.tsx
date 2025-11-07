"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function SettingsPage() {
  const { user, updateUserProfile } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [isUpdating, setIsUpdating] = useState(false)

  const subscription = (user as any)?.subscription

  const formatDate = (value: unknown): string | null => {
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

  const getFormattedDate = (...values: unknown[]): string | null => {
    for (const value of values) {
      const formatted = formatDate(value)
      if (formatted) {
        return formatted
      }
    }
    return null
  }

  const nextBillingDate = getFormattedDate((subscription as any)?.currentPeriodEnd, (subscription as any)?.current_period_end)
  const lastPaymentDate = getFormattedDate((subscription as any)?.lastPaymentDate)

  if (!user) {
    return <div className="p-8 text-center">Please log in to view settings</div>
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!displayName.trim()) {
      toast({
        title: "Error",
        description: "Display name cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpdating(true)

      // Update user profile
      await updateUserProfile({ displayName })

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email ?? ""} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-updates" className="font-medium">
                        Project Updates
                      </Label>
                      <p className="text-sm text-gray-500">Receive updates about your projects</p>
                    </div>
                    <Switch id="email-updates" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-team" className="font-medium">
                        Team Activity
                      </Label>
                      <p className="text-sm text-gray-500">Receive updates about team activity</p>
                    </div>
                    <Switch id="email-team" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-marketing" className="font-medium">
                        Marketing
                      </Label>
                      <p className="text-sm text-gray-500">Receive marketing and promotional emails</p>
                    </div>
                    <Switch id="email-marketing" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">In-App Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="app-updates" className="font-medium">
                        Project Updates
                      </Label>
                      <p className="text-sm text-gray-500">Receive in-app notifications about your projects</p>
                    </div>
                    <Switch id="app-updates" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="app-team" className="font-medium">
                        Team Activity
                      </Label>
                      <p className="text-sm text-gray-500">Receive in-app notifications about team activity</p>
                    </div>
                    <Switch id="app-team" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="app-system" className="font-medium">
                        System Notifications
                      </Label>
                      <p className="text-sm text-gray-500">Receive in-app notifications about system updates</p>
                    </div>
                    <Switch id="app-system" defaultChecked />
                  </div>
                </div>
              </div>

              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-amber-50 rounded-md border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-amber-800">
                      {subscription?.tier === "premium"
                        ? "Premium Plan"
                        : subscription?.tier === "standard"
                          ? "Standard Plan"
                          : "Free Plan"}
                    </h3>
                    <p className="text-sm text-amber-700">
                      {subscription?.tier === "premium"
                        ? "All features included"
                        : subscription?.tier === "standard"
                          ? "Most features included"
                          : "Basic features only"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-amber-800">
                      {subscription?.tier === "premium"
                        ? "$49"
                        : subscription?.tier === "standard"
                          ? "$29"
                          : "$0"}
                      <span className="text-sm font-normal">/month</span>
                    </div>
                    {subscription?.tier !== "free" && (
                      <p className="text-xs text-amber-700">
                        Next billing date:{" "}
                        {nextBillingDate ?? "N/A"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Payment Method</h3>
                {subscription?.paymentMethodId ? (
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium">💳</span>
                      </div>
                      <div>
                        <div className="font-medium">•••• •••• •••• 4242</div>
                        <div className="text-sm text-gray-500">Expires 12/25</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Update
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 border rounded-md text-center">
                    <p className="text-gray-500 mb-4">No payment method on file</p>
                    <Button>Add Payment Method</Button>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Billing History</h3>
                {lastPaymentDate ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lastPaymentDate ?? "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subscription?.tier === "premium" ? "$49.00" : "$29.00"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Paid
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No billing history available</p>
                )}
              </div>

              {subscription?.tier !== "free" && (
                <div className="pt-4 border-t">
                  <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect with other services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-blue-600">S</span>
                    </div>
                    <div>
                      <div className="font-medium">Salesforce</div>
                      <div className="text-sm text-gray-500">
                        {user.systemsConnected?.salesforce ? "Connected" : "Not connected"}
                      </div>
                    </div>
                  </div>
                  <Button variant={user.systemsConnected?.salesforce ? "outline" : "default"}>
                    {user.systemsConnected?.salesforce ? "Disconnect" : "Connect"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-blue-600">M</span>
                    </div>
                    <div>
                      <div className="font-medium">Microsoft 365</div>
                      <div className="text-sm text-gray-500">
                        {user.systemsConnected?.microsoft365 ? "Connected" : "Not connected"}
                      </div>
                    </div>
                  </div>
                  <Button variant={user.systemsConnected?.microsoft365 ? "outline" : "default"}>
                    {user.systemsConnected?.microsoft365 ? "Disconnect" : "Connect"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-blue-600">Q</span>
                    </div>
                    <div>
                      <div className="font-medium">QuickBooks</div>
                      <div className="text-sm text-gray-500">
                        {user.systemsConnected?.quickbooks ? "Connected" : "Not connected"}
                      </div>
                    </div>
                  </div>
                  <Button variant={user.systemsConnected?.quickbooks ? "outline" : "default"}>
                    {user.systemsConnected?.quickbooks ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">API Access</h3>
                <div className="p-4 border rounded-md space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="flex">
                      <Input id="api-key" value="••••••••••••••••••••••••••••••" disabled className="rounded-r-none" />
                      <Button className="rounded-l-none">Show</Button>
                    </div>
                    <p className="text-xs text-gray-500">Last used: Never</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Regenerate Key</Button>
                    <Button variant="outline">Copy Key</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
