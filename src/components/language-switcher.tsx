"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useCurrency } from "@/lib/currency-context"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const { setCurrency } = useCurrency()

  const toggleLanguage = () => {
    // Toggle between 'en' and 'id'
    const newLanguage = language === "en" ? "id" : "en"
    console.log("Switching language to:", newLanguage)

    // Set language
    setLanguage(newLanguage)

    // Set corresponding currency
    setCurrency(newLanguage === "id" ? "IDR" : "USD")
  }

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
