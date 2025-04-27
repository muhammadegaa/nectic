"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Droplet, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { AssessmentForm } from "@/components/assessment-form"

export default function AssessmentPage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 flex flex-col">
      <header className="w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
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
      </header>

      <div className="container max-w-4xl mx-auto py-12 px-4 flex-1">
        <Link
          href="/welcome"
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to welcome
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Business Process Assessment</h1>
          <p className="text-gray-600">
            Complete this assessment to help us identify AI opportunities specific to your business workflows.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="text-xs mt-1 text-gray-600">Account</span>
            </div>
            <div className="flex-1 h-1 bg-amber-200 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="text-xs mt-1 text-gray-600">Assessment</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="text-xs mt-1 text-gray-400">Analysis</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
                4
              </div>
              <span className="text-xs mt-1 text-gray-400">Results</span>
            </div>
          </div>
        </div>

        <AssessmentForm />
      </div>
    </div>
  )
}
