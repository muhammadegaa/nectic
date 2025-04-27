"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useCurrency } from "@/lib/currency-context"
import { useEffect, useState } from "react"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const { setCurrency } = useCurrency()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleLanguage = () => {
    // Toggle between 'en' and 'id'
    const newLanguage = language === "en" ? "id" : "en"
    console.log("Switching language to:", newLanguage)

    // Set language
    setLanguage(newLanguage)

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("language", newLanguage)
    }

    // Set corresponding currency
    setCurrency(newLanguage === "id" ? "IDR" : "USD")

    // Force page reload to ensure all components update
    window.location.reload()
  }

  if (!mounted) return null

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 bg-white shadow-md"
    >
      {language === "en" ? "🇮🇩 Bahasa" : "🇺🇸 English"}
    </Button>
  )
}
