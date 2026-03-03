"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface LanguageContextType {
  t: (key: string) => string
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType>({
  t: (key: string) => key,
  isLoading: false,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [isLoading] = useState(false)

  const t = (key: string) => {
    // Return the key as-is for now (no translation)
    return key
  }

  return (
    <LanguageContext.Provider value={{ t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

