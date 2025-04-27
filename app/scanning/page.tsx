"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Droplet } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { generateOpportunitiesFromAssessment } from "@/lib/assessment-service"

export default function ScanningPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("Initializing analysis...")
  const [error, setError] = useState<string | null>(null)
  const [analysisStarted, setAnalysisStarted] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push("/login")
      return
    }

    // Start the analysis process
    startAnalysis()
  }, [user, router])

  // Function to start the analysis
  const startAnalysis = async () => {
    if (analysisStarted || !user) return

    try {
      setAnalysisStarted(true)

      // Simulate analysis progress
      const statuses = [
        "Initializing analysis...",
        "Processing assessment data...",
        "Identifying workflow patterns...",
        "Detecting inefficiencies...",
        "Finding AI opportunities...",
        "Calculating potential impact...",
        "Generating recommendations...",
        "Preparing your dashboard...",
      ]

      let currentStep = 0
      const interval = setInterval(() => {
        if (currentStep < statuses.length) {
          setStatus(statuses[currentStep])
          setProgress(Math.min(100, (currentStep / (statuses.length - 1)) * 100))
          currentStep++
        } else {
          clearInterval(interval)

          // Generate opportunities based on assessment
          generateOpportunitiesFromAssessment(user.uid)
            .then(() => {
              // Redirect to dashboard after analysis is complete
              setTimeout(() => {
                router.push("/app")
              }, 1500)
            })
            .catch((error) => {
              console.error("Error generating opportunities:", error)
              setError("Failed to generate opportunities. Please try again.")
            })
        }
      }, 2000)

      return () => clearInterval(interval)
    } catch (error) {
      console.error("Error starting analysis:", error)
      setError(error.message || "Failed to start analysis. Please try again.")
      setAnalysisStarted(false)
    }
  }

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

      <div className="container flex-1 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          {error ? (
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h2 className="text-2xl font-bold mb-2 text-red-700">Analysis Error</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="flex justify-center gap-4">
                <Link
                  href="/assessment"
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Back to Assessment
                </Link>
                <button
                  onClick={() => startAnalysis()}
                  className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="relative w-32 h-32 mx-auto mb-6">
                {/* Animated scanning effect */}
                <div className="absolute inset-0 rounded-full border-4 border-amber-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-600 animate-spin"></div>
                <div className="absolute inset-4 rounded-full bg-amber-100 flex items-center justify-center">
                  <Droplet className="h-10 w-10 text-amber-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Analyzing Your Business</h2>
              <p className="text-gray-600 mb-6">{status}</p>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div
                  className="bg-amber-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <p className="text-sm text-gray-500">
                This will take approximately 2-3 minutes. Please don't close this window.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
