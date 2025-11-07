"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Droplet, ArrowRight, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ROUTES } from '@/lib/routes'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function WelcomePage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push(ROUTES.LOGIN)
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
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Nectic!</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let's discover AI opportunities that can transform your business processes and save you time and money.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-amber-600">1</span>
                </div>
                <h3 className="font-semibold mb-2">Complete Assessment</h3>
                <p className="text-sm text-gray-600">
                  Answer questions about your business processes to help us identify opportunities.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-amber-600">2</span>
                </div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-gray-600">
                  Our AI analyzes your responses to identify automation opportunities specific to your business.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-amber-600">3</span>
                </div>
                <h3 className="font-semibold mb-2">Get Results</h3>
                <p className="text-sm text-gray-600">
                  Review personalized AI opportunities with estimated time and cost savings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Why complete the assessment?</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Personalized Recommendations</h4>
                <p className="text-sm text-gray-600">
                  Get AI opportunities tailored to your specific business processes and challenges.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Quantified Benefits</h4>
                <p className="text-sm text-gray-600">See estimated time and cost savings for each opportunity.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Implementation Guidance</h4>
                <p className="text-sm text-gray-600">
                  Get clear steps and requirements for implementing each AI solution.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Prioritized Opportunities</h4>
                <p className="text-sm text-gray-600">
                  Identify "quick wins" and high-impact opportunities to tackle first.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button onClick={() => router.push("/assessment")} size="lg" className="group">
            Start Assessment
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
