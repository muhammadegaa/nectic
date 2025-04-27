"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useState, useEffect } from "react"

export function CTASection() {
  const { language } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState("en")

  useEffect(() => {
    setMounted(true)
    setCurrentLanguage(language)
  }, [language])

  return (
    <section id="cta" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              {currentLanguage === "id"
                ? "Siap Mentransformasi Bisnis Anda dengan AI?"
                : "Ready to Transform Your Business with AI?"}
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              {currentLanguage === "id"
                ? "Bergabunglah dengan program early adopter kami hari ini dan bantu membentuk masa depan implementasi AI."
                : "Join our early adopter program today and help shape the future of AI implementation."}
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button className="bg-orange-500 hover:bg-orange-600">
              {currentLanguage === "id" ? "Amankan Early Access" : "Secure Early Access"}
            </Button>
            <Button variant="outline">{currentLanguage === "id" ? "Pelajari Lebih Lanjut" : "Learn More"}</Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {currentLanguage === "id"
              ? "Slot terbatas. Early adopter mendapatkan harga diskon seumur hidup."
              : "Limited spots available. Early adopters get lifetime discounted pricing."}
          </p>
        </div>
      </div>
    </section>
  )
}
