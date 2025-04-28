"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useState, useEffect } from "react"
import { CheckCircle2 } from "lucide-react"

export function HeroSection() {
  const { language, t } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-orange-100 px-3 py-1 text-sm text-orange-500">
              {language === "id" ? "Segera" : "Launching Soon"}
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
              {language === "id" ? "Temukan Keunggulan AI Anda" : "Find Your Next AI Advantage"}
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              {language === "id"
                ? "Nectic membantu bisnis menengah mengidentifikasi peluang AI praktis dan mengimplementasikannya tanpa keahlian teknis."
                : "Nectic helps mid-market businesses identify practical AI opportunities and implement them without technical expertise."}
            </p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <div className="grid gap-2">
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>
                    {language === "id"
                      ? "Temukan inefisiensi dalam alur kerja Anda"
                      : "Spot inefficiencies in your workflows"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{language === "id" ? "Temukan solusi AI praktis" : "Find practical AI solutions"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>
                    {language === "id"
                      ? "Dapatkan roadmap implementasi yang jelas"
                      : "Get clear implementation roadmaps"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-x-4">
            <Button className="bg-orange-500 hover:bg-orange-600">
              {language === "id" ? "Amankan Early Access" : "Secure Early Access"}
            </Button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {language === "id" ? "Hanya tersedia beberapa slot" : "Only few spots available"}
          </div>
        </div>
      </div>
    </section>
  )
}
