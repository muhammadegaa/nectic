"use client"

import { useLanguage } from "@/lib/language-context"
import { useEffect, useState } from "react"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "id" : "en")}
      className="fixed bottom-4 right-4 z-50 bg-white rounded-full px-3 py-1.5 shadow-md border flex items-center gap-2 hover:bg-gray-50 transition-colors"
      aria-label={language === "en" ? "Switch to Bahasa Indonesia" : "Switch to English"}
    >
      {language === "en" ? "🇮🇩" : "🇺🇸"}
      <span className="text-sm font-medium">{language === "en" ? "Bahasa" : "English"}</span>
    </button>
  )
}
