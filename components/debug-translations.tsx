"use client"

import { useLanguage } from "@/lib/language-context"
import { useCurrency } from "@/lib/currency-context"
import { useState } from "react"

export function DebugTranslations() {
  const { language, t } = useLanguage()
  const { currency } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-16 right-4 z-50 bg-white shadow-md text-xs px-2 py-1 rounded border"
      >
        Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-16 right-4 z-50 bg-white shadow-md p-3 rounded border max-w-xs max-h-60 overflow-auto">
      <div className="flex justify-between mb-2">
        <h3 className="font-bold text-sm">Translation Debug</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 text-xs">
          Close
        </button>
      </div>
      <div className="text-xs space-y-1">
        <p>
          <strong>Current Language:</strong> {language}
        </p>
        <p>
          <strong>Current Currency:</strong> {currency}
        </p>
        <p>
          <strong>hero_title:</strong> {t("hero_title")}
        </p>
        <p>
          <strong>hero_subtitle:</strong> {t("hero_subtitle")}
        </p>
        <p>
          <strong>hero_feature_1:</strong> {t("hero_feature_1")}
        </p>
      </div>
    </div>
  )
}
