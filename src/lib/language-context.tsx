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

  useEffect(() => {
    // Check for saved language preference
    const savedLanguage = localStorage.getItem("language") as SupportedLanguage
    if (savedLanguage === "en" || savedLanguage === "id") {
      setLanguageState(savedLanguage)
    }
    setIsLoading(false)
  }, [])

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang)
    // Save preference to localStorage
    localStorage.setItem("language", lang)
  }

  const t = (key: string, params?: Record<string, string | number>) => {
    // Make sure the key exists in the translations
    const languageMap = translations[language] as Record<string, string>
    const translation = languageMap[key] || key

    if (params) {
      return Object.entries(params).reduce((acc, [paramKey, value]) => {
        return acc.replace(`{${paramKey}}`, String(value))
      }, translation)
    }

    return translation
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>{children}</LanguageContext.Provider>
}
