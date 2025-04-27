"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clipboard, CheckCircle2, RefreshCw } from "lucide-react"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase-client"
import type { Invitation } from "@/lib/invitation-types"

export default function InvitationsAdminPage() {
  const [email, setEmail] = useState("")
  const [plan, setPlan] = useState("premium")
  const [loading, setLoading] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const generateInvitation = async () => {
    if (!email) return

    try {
      setLoading(true)

      // Generate a random code
      const code = Math.random().toString(36).substring(2, 10)

      // Create an invitation that expires in 30 days
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30)

      const invitationData: Omit<Invitation, "id"> = {
        email,
        code,
        plan: plan as "free" | "standard" | "premium",
        status: "pending",
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiryDate),
        createdBy: "admin",
      }

      // Add to Firestore
      const docRef = await addDoc(collection(db, "invitations"), invitationData)

      const invitationUrl = `${window.location.origin}/signup/invitation?code=${code}`

      setInvitation({
        id: docRef.id,
        ...invitationData,
        invitationUrl,
      })
    } catch (error) {
      console.error("Error creating invitation:", error)
      alert("Failed to create invitation")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!invitation) return

    navigator.clipboard.writeText(invitation.invitationUrl)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const resetForm = () => {
    setEmail("")
    setPlan("premium")
    setInvitation(null)
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Invitation Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create New Invitation</CardTitle>
          <CardDescription>Generate invitation links for new users</CardDescription>
        </CardHeader>
        <CardContent>
          {invitation ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md border border-green-100">
                <h3 className="font-medium text-green-800 mb-2">Invitation Created!</h3>
                <p className="text-sm text-green-700 mb-1">
                  <strong>Email:</strong> {invitation.email}
                </p>
                <p className="text-sm text-green-700 mb-1">
                  <strong>Plan:</strong> {invitation.plan}
                </p>
                <p className="text-sm text-green-700 mb-1">
                  <strong>Expires:</strong> {invitation.expiresAt.toDate().toLocaleDateString()}
                </p>
              </div>

              <div className="relative">
                <Input value={invitation.invitationUrl} readOnly className="pr-10" />
                <button
                  onClick={copyToClipboard}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  title="Copy to clipboard"
                >
                  {copied ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Clipboard className="h-5 w-5" />}
                </button>
              </div>

              <Button onClick={resetForm} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Create Another Invitation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="plan" className="text-sm font-medium">
                  Subscription Plan
                </label>
                <select
                  id="plan"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="free">Free</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <Button onClick={generateInvitation} disabled={!email || loading} className="w-full">
                {loading ? "Generating..." : "Generate Invitation Link"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
