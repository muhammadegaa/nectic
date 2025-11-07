"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const industries = [
  "Financial Services",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Technology",
  "Education",
  "Government",
  "Other",
]

const companySizes = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees",
]

const roles = [
  "CEO/Executive",
  "IT Manager",
  "Operations Manager",
  "Finance Manager",
  "Marketing Manager",
  "HR Manager",
  "Other",
]

export default function OnboardingPage() {
  const { user, updateUserProfile } = useAuth()
  const router = useRouter()

  const [industry, setIndustry] = useState("")
  const [companySize, setCompanySize] = useState("")
  const [role, setRole] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    setIsSubmitting(true)
    try {
      await updateUserProfile({
        industry: industry.toLowerCase().replace(/\s+/g, "-"),
        companySize,
        role,
      })

      router.push("/app")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to save your information. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return <div className="p-8 text-center">Please log in to continue</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 flex flex-col items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Tell us about your business</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            This information helps us personalize AI opportunities for your business.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Industry</label>
              <Select value={industry} onValueChange={setIndustry} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Company Size</label>
              <Select value={companySize} onValueChange={setCompanySize} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Your Role</label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
