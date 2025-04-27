"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Droplet, ArrowLeft, CheckCircle } from "lucide-react"
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase-client"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import type { Invitation } from "@/lib/invitation-types"
import { useBypassAuth } from "@/lib/bypass-auth"

export default function InvitationSignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp } = useAuth()
  const invitationCode = searchParams.get("code")
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { doubleClicked, secretCode, handleDoubleClick, handleKeyDown } = useBypassAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const password = watch("password")

  // Add this function near the top of the component
  const createTestInvitation = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/create-test-invitation")
      const data = await response.json()

      if (data.success) {
        // Redirect to the invitation URL
        router.push(data.invitation.invitationUrl)
      } else {
        setError("Failed to create test invitation")
      }
    } catch (error) {
      console.error("Error creating test invitation:", error)
      setError("Failed to create test invitation")
    } finally {
      setLoading(false)
    }
  }

  // Add this function near the top of the component, after the existing createTestInvitation function

  const bypassInvitationForTesting = async () => {
    try {
      setLoading(true)
      setError(null)

      // Create a mock invitation object
      const mockInvitation: Invitation = {
        id: "test-invitation",
        email: "test@example.com", // This will be editable in the form
        code: invitationCode || "test-code",
        plan: "premium",
        status: "pending",
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        createdBy: "system",
      }

      setInvitation(mockInvitation)
      setLoading(false)
    } catch (error) {
      console.error("Error bypassing invitation:", error)
      setError("Failed to bypass invitation")
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!invitationCode) {
      setError("Invalid invitation code")
      setLoading(false)
      return
    }

    const fetchInvitation = async () => {
      try {
        console.log("Fetching invitation with code:", invitationCode)

        const q = query(
          collection(db, "invitations"),
          where("code", "==", invitationCode),
          where("status", "==", "pending"),
        )
        const querySnapshot = await getDocs(q)

        console.log("Query results:", querySnapshot.size)

        if (querySnapshot.empty) {
          console.log("No matching invitation found")
          setError("Invalid or expired invitation code")
          setLoading(false)
          return
        }

        const invitationData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
        } as Invitation

        console.log("Found invitation:", invitationData)

        // Check if invitation has expired
        if (invitationData.expiresAt.toDate() < new Date()) {
          console.log("Invitation expired:", invitationData.expiresAt.toDate())
          await updateDoc(doc(db, "invitations", invitationData.id), {
            status: "expired",
          })
          setError("This invitation has expired")
          setLoading(false)
          return
        }

        setInvitation(invitationData)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching invitation:", error)
        setError("Failed to verify invitation")
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [invitationCode])

  const onSubmit = async (data: { name: string; email: string; password: string }) => {
    if (!invitation) return

    try {
      setIsSubmitting(true)
      setError(null)

      // For testing purposes, allow any email if this is a test invitation
      const isTestMode = invitation.id === "test-invitation" || invitation.createdBy === "system"

      // Only verify email matches invitation if not in test mode
      if (!isTestMode && data.email.toLowerCase() !== invitation.email.toLowerCase()) {
        setError("Email does not match the invitation")
        setIsSubmitting(false)
        return
      }

      // Create user account
      await signUp(data.email, data.password, data.name, invitation.plan)

      // Update invitation status if it's a real invitation (not test mode)
      if (!isTestMode && invitation.id !== "test-invitation") {
        await updateDoc(doc(db, "invitations", invitation.id), {
          status: "accepted",
          usedAt: Timestamp.now(),
        })
      }

      setIsSuccess(true)

      // Redirect to checkout page after a delay
      setTimeout(() => {
        router.push(`/checkout?plan=${invitation.plan}`)
      }, 1500)
    } catch (err: any) {
      console.error("Signup error:", err)

      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.")
      } else {
        setError("Failed to create account. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 flex flex-col">
      <header
        className="w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm"
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative w-8 h-8 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20">
              <Droplet className="h-5 w-5 text-primary transition-all duration-300 group-hover:scale-110" />
            </div>
            <span className="inline-block font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-600">
              Nectic
            </span>
          </Link>
        </div>

        {/* Secret code input display */}
        {doubleClicked && (
          <div className="absolute top-16 right-4 bg-white p-2 rounded shadow-md border text-xs">
            <span>Code: {secretCode}</span>
          </div>
        )}
      </header>

      <div className="container max-w-md mx-auto py-12 px-4 flex-1">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to home
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Accept Invitation</CardTitle>
            <CardDescription>Create your account to join Nectic</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Verifying invitation...</div>
            ) : error ? (
              <div className="text-center py-4">
                <div className="text-red-500 mb-4">{error}</div>
                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/">Return to Homepage</Link>
                  </Button>

                  <Button variant="outline" onClick={createTestInvitation}>
                    Create Test Invitation
                  </Button>

                  <Button variant="secondary" onClick={bypassInvitationForTesting}>
                    Bypass Invitation for Testing
                  </Button>
                </div>
              </div>
            ) : isSuccess ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Account Created!</h3>
                <p className="text-gray-600 mb-4">
                  Your account has been created successfully. You'll be redirected to the dashboard.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <p className="text-sm text-blue-800">
                    You've been invited to join Nectic with a <strong>{invitation?.plan}</strong> plan.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register("name", {
                      required: "Name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                    })}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={invitation?.email}
                    readOnly={invitation?.id !== "test-invitation" && invitation?.createdBy !== "system"}
                    className={
                      invitation?.id !== "test-invitation" && invitation?.createdBy !== "system" ? "bg-gray-50" : ""
                    }
                    {...register("email")}
                  />
                  <p className="text-xs text-gray-500">
                    {invitation?.id === "test-invitation" || invitation?.createdBy === "system"
                      ? "Test mode: You can use any email address"
                      : "This email is linked to your invitation and cannot be changed."}
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                  />
                  {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) => value === password || "Passwords do not match",
                    })}
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </Button>

                <div className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link href="/login" className="text-amber-600 hover:underline">
                    Log in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
