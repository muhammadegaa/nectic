// Currency conversion rates (as of March 2025)
// These should ideally be fetched from a currency API in production
export const CURRENCY_RATES = {
  USD: 1,
  GBP: 0.78, // 1 USD = 0.78 GBP
  IDR: 15750, // 1 USD = 15,750 IDR
}

export type SupportedCurrency = keyof typeof CURRENCY_RATES

export interface CurrencyInfo {
  code: SupportedCurrency
  symbol: string
  position: "before" | "after"
  thousandsSeparator: string
  decimalSeparator: string
  decimals: number
}

export const CURRENCY_INFO: Record<SupportedCurrency, CurrencyInfo> = {
  USD: {
    code: "USD",
    symbol: "$",
    position: "before",
    thousandsSeparator: ",",
    decimalSeparator: ".",
    decimals: 0,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    position: "before",
    thousandsSeparator: ",",
    decimalSeparator: ".",
    decimals: 0,
  },
  IDR: {
    code: "IDR",
    symbol: "Rp",
    position: "before",
    thousandsSeparator: ".",
    decimalSeparator: ",",
    decimals: 0,
  },
}

// Add a function to get marketing-friendly prices for IDR
export function getMarketingPrice(amountUSD: number, currency: SupportedCurrency): number {
  if (currency === "IDR") {
    // Special case for IDR - use rounded, attractive prices
    switch (amountUSD) {
      case 249:
        return 3900000 // Standard plan
      case 199:
        return 2990000 // Early adopter standard plan
      case 499:
        return 7900000 // Premium plan
      case 399:
        return 5990000 // Early adopter premium plan
      default:
        return Math.round((amountUSD * CURRENCY_RATES[currency]) / 1000) * 1000 // Round to nearest 1000
    }
  }

  // For other currencies, use regular conversion
  return amountUSD * CURRENCY_RATES[currency]
}

// Update the convertCurrency function to use marketing prices for IDR
export function convertCurrency(amountUSD: number, targetCurrency: SupportedCurrency): number {
  return getMarketingPrice(amountUSD, targetCurrency)
}

// Format currency for display
export function formatCurrency(amount: number, currency: SupportedCurrency): string {
  const info = CURRENCY_INFO[currency]

  // Round to the appropriate number of decimals
  const roundedAmount = Math.round(amount * Math.pow(10, info.decimals)) / Math.pow(10, info.decimals)

  // Format the number with appropriate separators
  const parts = roundedAmount.toFixed(info.decimals).split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, info.thousandsSeparator)

  const formattedAmount = parts.join(info.decimalSeparator)

  // Add the currency symbol in the correct position
  if (info.position === "before") {
    return `${info.symbol}${formattedAmount}`
  } else {
    return `${formattedAmount} ${info.symbol}`
  }
}
