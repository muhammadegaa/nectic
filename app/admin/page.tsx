"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, orderBy, getDocs, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase-client"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import type { Invitation, InvitationFormData, UserPlan } from "@/lib/invitation-types"

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<InvitationFormData>({
    email: "",
    plan: "free",
    expiryDays: 7,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // In a real app, you would check if the user has admin privileges
    // For now, we'll assume all authenticated users can access this page
    fetchInvitations()
  }, [user, router])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const q = query(collection(db, "invitations"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      const invitationData: Invitation[] = []
      querySnapshot.forEach((doc) => {
        invitationData.push({ id: doc.id, ...doc.data() } as Invitation)
      })

      setInvitations(invitationData)
    } catch (error) {
      console.error("Error fetching invitations:", error)
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateInvitationCode = () => {
    // Generate a random 8-character code
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      setIsSubmitting(true)

      const code = generateInvitationCode()
      const now = Timestamp.now()
      const expiresAt = Timestamp.fromDate(new Date(now.toDate().getTime() + formData.expiryDays * 24 * 60 * 60 * 1000))

      const invitationData: Omit<Invitation, "id"> = {
        email: formData.email,
        code,
        plan: formData.plan as UserPlan,
        status: "pending",
        createdAt: now,
        expiresAt,
        createdBy: user.uid,
      }

      await addDoc(collection(db, "invitations"), invitationData)

      toast({
        title: "Invitation Created",
        description: `Invitation sent to ${formData.email}`,
      })

      // Reset form
      setFormData({
        email: "",
        plan: "free",
        expiryDays: 7,
      })

      // Refresh invitations list
      fetchInvitations()
    } catch (error) {
      console.error("Error creating invitation:", error)
      toast({
        title: "Error",
        description: "Failed to create invitation",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString()
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Invitation</CardTitle>
            <CardDescription>Invite new users to join Nectic</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="plan" className="text-sm font-medium">
                  Plan
                </label>
                <Select
                  value={formData.plan}
                  onValueChange={(value: UserPlan) => setFormData({ ...formData, plan: value })}
                >
                  <SelectTrigger id="plan">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="expiryDays" className="text-sm font-medium">
                  Expires After (days)
                </label>
                <Input
                  id="expiryDays"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.expiryDays}
                  onChange={(e) => setFormData({ ...formData, expiryDays: Number.parseInt(e.target.value) })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Invitation"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Invitations</CardTitle>
            <CardDescription>Manage your sent invitations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading invitations...</div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No invitations found</div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-gray-500">Code: {invitation.code}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(invitation.status)}`}>
                        {invitation.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Plan: {invitation.plan}</p>
                      <p>Created: {formatDate(invitation.createdAt)}</p>
                      <p>Expires: {formatDate(invitation.expiresAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
            <CardDescription>Manage feature flags to control feature availability</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/feature-flags")} className="w-full">
              Manage Feature Flags
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
