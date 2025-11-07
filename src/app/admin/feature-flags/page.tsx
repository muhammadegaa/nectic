"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { featureFlagService } from "@/lib/feature-flag-service"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import type { FeatureFlag, FeatureFlagStatus, FeatureFlagTarget } from "@/lib/feature-flag-types"
import { Slider } from "@/components/ui/slider"
import { Trash, Plus, RefreshCw } from "lucide-react"
import { ROUTES } from '@/lib/routes'

export default function FeatureFlagsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newFlag, setNewFlag] = useState<Partial<FeatureFlag>>({
    name: "",
    description: "",
    status: "disabled",
    target: "global",
  })

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      router.push(ROUTES.LOGIN)
      return
    }

    // In a real app, you would check if the user has admin privileges
    fetchFlags()
  }, [user, router])

  const fetchFlags = async () => {
    try {
      setLoading(true)
      const allFlags = await featureFlagService.getFlags()
      setFlags(allFlags)
    } catch (error) {
      console.error("Error fetching feature flags:", error)
      toast({
        title: "Error",
        description: "Failed to load feature flags",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFlag = async () => {
    if (!user || !newFlag.name) return

    try {
      await featureFlagService.createFlag({
        ...(newFlag as Omit<FeatureFlag, "id" | "createdAt" | "updatedAt">),
        createdBy: user.uid,
      })

      toast({
        title: "Feature Flag Created",
        description: `Feature flag "${newFlag.name}" has been created`,
      })

      // Reset form and refresh flags
      setNewFlag({
        name: "",
        description: "",
        status: "disabled",
        target: "global",
      })
      setIsCreating(false)
      fetchFlags()
    } catch (error) {
      console.error("Error creating feature flag:", error)
      toast({
        title: "Error",
        description: "Failed to create feature flag",
        variant: "destructive",
      })
    }
  }

  const handleUpdateFlag = async (id: string, updates: Partial<FeatureFlag>) => {
    try {
      await featureFlagService.updateFlag(id, updates)
      toast({
        title: "Feature Flag Updated",
        description: "Feature flag has been updated",
      })
      fetchFlags()
    } catch (error) {
      console.error("Error updating feature flag:", error)
      toast({
        title: "Error",
        description: "Failed to update feature flag",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFlag = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feature flag?")) return

    try {
      await featureFlagService.deleteFlag(id)
      toast({
        title: "Feature Flag Deleted",
        description: "Feature flag has been deleted",
      })
      fetchFlags()
    } catch (error) {
      console.error("Error deleting feature flag:", error)
      toast({
        title: "Error",
        description: "Failed to delete feature flag",
        variant: "destructive",
      })
    }
  }

  const toggleFlagStatus = (flag: FeatureFlag) => {
    const newStatus: FeatureFlagStatus = flag.status === "enabled" ? "disabled" : "enabled"
    handleUpdateFlag(flag.id, { status: newStatus })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Feature Flags</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchFlags} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setIsCreating(!isCreating)} className="flex items-center gap-2">
            {isCreating ? (
              "Cancel"
            ) : (
              <>
                <Plus className="h-4 w-4" /> New Flag
              </>
            )}
          </Button>
        </div>
      </div>

      {isCreating && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Feature Flag</CardTitle>
            <CardDescription>Define a new feature flag to control feature availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newFlag.name || ""}
                  onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                  placeholder="Feature name"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newFlag.description || ""}
                  onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                  placeholder="Feature description"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newFlag.status}
                  onValueChange={(value: FeatureFlagStatus) => setNewFlag({ ...newFlag, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="percentage">Percentage Rollout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newFlag.status === "percentage" && (
                <div className="grid gap-3">
                  <Label>Percentage ({newFlag.percentage || 0}%)</Label>
                  <Slider
                    value={[newFlag.percentage || 0]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setNewFlag({ ...newFlag, percentage: value[0] })}
                  />
                </div>
              )}

              <div className="grid gap-3">
                <Label htmlFor="target">Target</Label>
                <Select
                  value={newFlag.target}
                  onValueChange={(value: FeatureFlagTarget) => setNewFlag({ ...newFlag, target: value })}
                >
                  <SelectTrigger id="target">
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (All Users)</SelectItem>
                    <SelectItem value="role">Role-Based</SelectItem>
                    <SelectItem value="user">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newFlag.target === "role" && (
                <div className="grid gap-3">
                  <Label htmlFor="targetValue">Roles (comma-separated)</Label>
                  <Input
                    id="targetValue"
                    value={
                      Array.isArray(newFlag.targetValue) ? newFlag.targetValue.join(", ") : newFlag.targetValue || ""
                    }
                    onChange={(e) =>
                      setNewFlag({ ...newFlag, targetValue: e.target.value.split(",").map((r) => r.trim()) })
                    }
                    placeholder="premium, standard"
                  />
                </div>
              )}

              {newFlag.target === "user" && (
                <div className="grid gap-3">
                  <Label htmlFor="targetValue">User IDs (comma-separated)</Label>
                  <Input
                    id="targetValue"
                    value={
                      Array.isArray(newFlag.targetValue) ? newFlag.targetValue.join(", ") : newFlag.targetValue || ""
                    }
                    onChange={(e) =>
                      setNewFlag({ ...newFlag, targetValue: e.target.value.split(",").map((u) => u.trim()) })
                    }
                    placeholder="user1, user2"
                  />
                </div>
              )}

              <Button onClick={handleCreateFlag} disabled={!newFlag.name}>
                Create Feature Flag
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Flags</TabsTrigger>
          <TabsTrigger value="enabled">Enabled</TabsTrigger>
          <TabsTrigger value="disabled">Disabled</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <FeatureFlagList
            flags={flags}
            loading={loading}
            onToggle={toggleFlagStatus}
            onDelete={handleDeleteFlag}
            onUpdate={handleUpdateFlag}
          />
        </TabsContent>

        <TabsContent value="enabled">
          <FeatureFlagList
            flags={flags.filter((f) => f.status === "enabled")}
            loading={loading}
            onToggle={toggleFlagStatus}
            onDelete={handleDeleteFlag}
            onUpdate={handleUpdateFlag}
          />
        </TabsContent>

        <TabsContent value="disabled">
          <FeatureFlagList
            flags={flags.filter((f) => f.status === "disabled")}
            loading={loading}
            onToggle={toggleFlagStatus}
            onDelete={handleDeleteFlag}
            onUpdate={handleUpdateFlag}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface FeatureFlagListProps {
  flags: FeatureFlag[]
  loading: boolean
  onToggle: (flag: FeatureFlag) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<FeatureFlag>) => void
}

function FeatureFlagList({ flags, loading, onToggle, onDelete, onUpdate }: FeatureFlagListProps) {
  if (loading) {
    return <div className="text-center py-8">Loading feature flags...</div>
  }

  if (flags.length === 0) {
    return <div className="text-center py-8 text-gray-500">No feature flags found</div>
  }

  return (
    <div className="grid gap-4">
      {flags.map((flag) => (
        <Card key={flag.id}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{flag.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{flag.description}</p>

                <div className="mt-4 grid gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <span
                      className={`text-sm ${flag.status === "enabled" ? "text-green-600" : flag.status === "percentage" ? "text-blue-600" : "text-red-600"}`}
                    >
                      {flag.status === "enabled"
                        ? "Enabled"
                        : flag.status === "percentage"
                          ? `${flag.percentage}% of users`
                          : "Disabled"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Target:</span>
                    <span className="text-sm">
                      {flag.target === "global"
                        ? "All Users"
                        : flag.target === "role"
                          ? `Roles: ${Array.isArray(flag.targetValue) ? flag.targetValue.join(", ") : flag.targetValue}`
                          : `Specific Users: ${Array.isArray(flag.targetValue) ? flag.targetValue.join(", ") : flag.targetValue}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {flag.status !== "percentage" && (
                  <div className="flex items-center gap-2">
                    <Switch checked={flag.status === "enabled"} onCheckedChange={() => onToggle(flag)} />
                    <span className="text-sm">{flag.status === "enabled" ? "On" : "Off"}</span>
                  </div>
                )}

                <Button variant="ghost" size="sm" onClick={() => onDelete(flag.id)}>
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>

            {flag.status === "percentage" && (
              <div className="mt-4">
                <Label>Percentage ({flag.percentage || 0}%)</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Slider
                      value={[flag.percentage || 0]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => onUpdate(flag.id, { percentage: value[0] })}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onUpdate(flag.id, { status: "enabled" })}>
                    Enable for All
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
