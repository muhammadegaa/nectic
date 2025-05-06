"use client"

import { useLanguage } from "@/lib/language-context"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "id" : "en")
  }

  return (
    <button
      onClick={toggleLanguage}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-all duration-200"
      aria-label={language === "en" ? "Switch to Bahasa Indonesia" : "Switch to English"}
    >
      <span className="text-sm font-medium">{language === "en" ? "🇮🇩 Bahasa" : "🇺🇸 English"}</span>
    </button>
  )
}
