"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type SupportedCurrency, formatCurrency, convertCurrency } from "./currency-utils"

interface CurrencyContextType {
  currency: SupportedCurrency
  setCurrency: (currency: SupportedCurrency) => void
  formatPrice: (amountUSD: number) => string
  convertPrice: (amountUSD: number) => number
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  formatPrice: (amount) => `$${amount}`,
  convertPrice: (amount) => amount,
  isLoading: false,
})

export const useCurrency = () => useContext(CurrencyContext)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>("USD")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for saved currency preference
    const savedCurrency = localStorage.getItem("currency") as SupportedCurrency
    if (savedCurrency === "USD" || savedCurrency === "IDR" || savedCurrency === "GBP") {
      setCurrencyState(savedCurrency)
    }
    setIsLoading(false)
  }, [])

  const setCurrency = (curr: SupportedCurrency) => {
    setCurrencyState(curr)
    // Save preference to localStorage
    localStorage.setItem("currency", curr)
  }

  const formatPrice = (amountUSD: number) => {
    return formatCurrency(convertCurrency(amountUSD, currency), currency)
  }

  const convertPrice = (amountUSD: number) => {
    return convertCurrency(amountUSD, currency)
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertPrice, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  )
}
