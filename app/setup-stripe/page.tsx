"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function SetupStripePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    standardPriceId?: string
    premiumPriceId?: string
    message?: string
    error?: string
  } | null>(null)

  const setupStripeProducts = async () => {
    try {
      setLoading(true)

      // Create products and prices directly using the Stripe API
      const response = await fetch("/api/setup-stripe-products", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup Stripe Products</CardTitle>
          <CardDescription>Create subscription products and prices in your Stripe account</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-600">
            This will create Standard ($49/month) and Premium ($99/month) subscription plans in your Stripe account.
          </p>

          {result && (
            <div className={`p-4 mb-4 rounded-md ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <div className="flex items-start">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                    {result.success ? "Success!" : "Error!"}
                  </p>
                  <p className={`text-sm ${result.success ? "text-green-700" : "text-red-700"}`}>
                    {result.message || result.error}
                  </p>

                  {result.success && (
                    <div className="mt-3 p-3 bg-gray-100 rounded text-sm font-mono">
                      <p>STRIPE_STANDARD_PRICE_ID={result.standardPriceId}</p>
                      <p>STRIPE_PREMIUM_PRICE_ID={result.premiumPriceId}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={setupStripeProducts} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Products...
              </>
            ) : (
              "Create Stripe Products"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
