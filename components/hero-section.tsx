"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useState, useEffect } from "react"

export function HeroSection() {
  const { language } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState("en")

  useEffect(() => {
    setMounted(true)
    setCurrentLanguage(language)
  }, [language])

  // Define features based on current language
  const features = !mounted
    ? []
    : currentLanguage === "id"
      ? [
          "Temukan inefisiensi dalam alur kerja Anda",
          "Temukan solusi AI praktis",
          "Dapatkan roadmap implementasi yang jelas",
        ]
      : ["Spot inefficiencies in your workflows", "Find practical AI solutions", "Get clear implementation roadmaps"]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-orange-100 px-3 py-1 text-sm text-orange-500">
              {currentLanguage === "id" ? "Segera" : "Launching Soon"}
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
              {currentLanguage === "id" ? "Temukan Keunggulan AI Anda" : "Find Your Next AI Advantage"}
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              {currentLanguage === "id"
                ? "Nectic membantu bisnis menengah mengidentifikasi peluang AI praktis dan mengimplementasikannya tanpa keahlian teknis."
                : "Nectic helps mid-market businesses identify practical AI opportunities and implement them without technical expertise."}
            </p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <div className="grid gap-2">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center">
                  <svg
                    className=" mr-2 h-4 w-4 text-orange-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-x-4">
            <Button className="bg-orange-500 hover:bg-orange-600">
              {currentLanguage === "id" ? "Amankan Early Access" : "Secure Early Access"}
            </Button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {currentLanguage === "id" ? "Hanya tersedia beberapa slot" : "Only few spots available"}
          </div>
        </div>
      </div>
    </section>
  )
}
