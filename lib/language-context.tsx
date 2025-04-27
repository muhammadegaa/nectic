"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { en } from "@/lib/translations/en"
import { id } from "@/lib/translations/id"

type SupportedLanguage = "en" | "id"

interface LanguageContextType {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  t: (key: string, params?: Record<string, string | number>) => string
  isLoading: boolean
}

const translations = {
  en,
  id,
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
  isLoading: false,
})

export const useLanguage = () => useContext(LanguageContext)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en")
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Check for saved language preference
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language") as SupportedLanguage
      if (savedLanguage === "en" || savedLanguage === "id") {
        setLanguageState(savedLanguage)
      }
    }
    setIsLoading(false)
  }, [])

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang)
    // Save preference to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang)
    }
  }

  const t = (key: string, params?: Record<string, string | number>) => {
    // Make sure the key exists in the translations
    const translation = translations[language][key] || key

    if (params) {
      return Object.entries(params).reduce((acc, [paramKey, value]) => {
        return acc.replace(`{${paramKey}}`, String(value))
      }, translation)
    }

    return translation
  }

  // If not mounted yet, provide a minimal context to avoid hydration issues
  if (!isMounted) {
    return (
      <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>{children}</LanguageContext.Provider>
    )
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>{children}</LanguageContext.Provider>
}
