"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { en } from "./translations/en"
import { id } from "./translations/id"

type LanguageContextType = {
  language: string
  setLanguage: (lang: string) => void
  t: (key: string, fallback?: string) => string
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: () => "",
  isLoading: true,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState("en")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language") || "en"
      setLanguage(savedLanguage)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Save language preference
    if (!isLoading) {
      localStorage.setItem("language", language)
    }
  }, [language, isLoading])

  const t = (key: string, fallback?: string): string => {
    const translations = language === "en" ? en : id
    return translations[key as keyof typeof translations] || fallback || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => useContext(LanguageContext)
