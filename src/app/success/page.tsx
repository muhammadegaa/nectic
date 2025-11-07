"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Droplet, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const setupIntent = searchParams.get("setup_intent")
  const plan = searchParams.get("plan")
  const [planName, setPlanName] = useState("")
  const { t, isLoading } = useLanguage()

  useEffect(() => {
    if (plan === "premium") {
      setPlanName(isLoading ? "Premium Plan" : t("pricing_premium_title"))
    } else {
      setPlanName(isLoading ? "Standard Plan" : t("pricing_standard_title"))
    }
  }, [plan, isLoading, t])

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

      <div className="container max-w-md mx-auto py-12 px-4 flex-1">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isLoading ? "Back to home" : t("checkout_back")}
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-8 animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold mb-4">{isLoading ? "Early Access Secured!" : t("success_title")}</h1>
            <p className="text-gray-600 mb-8">
              {isLoading
                ? `Thank you for securing early access to Nectic with the ${planName}.`
                : `${t("success_message")} ${planName}.`}
            </p>

            <Button asChild className="w-full group relative overflow-hidden">
              <Link href="/">
                <span className="relative z-10">{isLoading ? "Return to Homepage" : t("success_return")}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
