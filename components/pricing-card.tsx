"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCurrency } from "@/lib/currency-context"
import { useLanguage } from "@/lib/language-context"
import { usePathname } from "next/navigation"

interface PricingCardProps {
  title: string
  description: string
  priceUSD: number
  earlyAdopterPriceUSD: number
  features: string[]
  plan: "standard" | "premium"
  popular?: boolean
  billingPeriod?: "6month" | "12month"
}

export function PricingCard({
  title,
  description,
  features,
  plan,
  popular = false,
  billingPeriod = "6month",
}: PricingCardProps) {
  const { currency } = useCurrency()
  const { language, t } = useLanguage()
  const pathname = usePathname()
  const isHomepage = pathname === "/"

  // Get the price keys based on the plan
  const regularPriceKey = plan === "standard" ? "pricing_standard_regular_price" : "pricing_premium_regular_price"
  const earlyPriceKey = plan === "standard" ? "pricing_standard_early_price" : "pricing_premium_early_price"
  const priceKey = plan === "standard" ? "pricing_standard_price" : "pricing_premium_price"
  const currentKey = plan === "standard" ? "pricing_standard_current" : "pricing_premium_current"

  // Get the title and description keys
  const titleKey = plan === "standard" ? "pricing_standard_title" : "pricing_premium_title"
  const descKey = plan === "standard" ? "pricing_standard_desc" : "pricing_premium_desc"

  // Feature keys
  const featureKeys = [
    plan === "standard" ? "pricing_standard_feature1" : "pricing_premium_feature1",
    plan === "standard" ? "pricing_standard_feature2" : "pricing_premium_feature2",
    plan === "standard" ? "pricing_standard_feature3" : "pricing_premium_feature3",
    plan === "standard" ? "pricing_standard_feature4" : "pricing_premium_feature4",
  ]

  // Get monthly prices
  const getMonthlyPrice = () => {
    if (plan === "standard") {
      return billingPeriod === "6month" ? "$199" : "$159"
    } else {
      return billingPeriod === "6month" ? "$399" : "$319"
    }
  }

  const getMonthlyRegularPrice = () => {
    if (plan === "standard") {
      return billingPeriod === "6month" ? "$249" : "$199"
    } else {
      return billingPeriod === "6month" ? "$499" : "$399"
    }
  }

  // Calculate total prices based on billing period
  const getTotalPrice = () => {
    if (plan === "standard") {
      return billingPeriod === "6month" ? "$1,194" : "$1,908"
    } else {
      return billingPeriod === "6month" ? "$2,394" : "$3,828"
    }
  }

  const getTotalRegularPrice = () => {
    if (plan === "standard") {
      return billingPeriod === "6month" ? "$1,494" : "$2,388"
    } else {
      return billingPeriod === "6month" ? "$2,994" : "$4,788"
    }
  }

  // Display price based on page
  const getDisplayPrice = () => {
    return isHomepage ? getMonthlyPrice() : getTotalPrice()
  }

  const getRegularPrice = () => {
    return isHomepage ? getMonthlyRegularPrice() : getTotalRegularPrice()
  }

  const getPeriodLabel = () => {
    if (isHomepage) {
      return billingPeriod === "6month"
        ? "/ month (billed as " + getTotalPrice() + " for 6 months)"
        : "/ month (billed as " + getTotalPrice() + " for 12 months)"
    } else {
      return billingPeriod === "6month" ? "/ 6 months" : "/ year"
    }
  }

  return (
    <div
      className={`relative flex flex-col p-6 bg-white shadow-lg rounded-lg border ${
        popular ? "border-primary" : "border-gray-200"
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
            {t("pricing_popular", "Most Popular")}
          </span>
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold">{t(titleKey, title)}</h3>
        <p className="text-gray-500 mt-2">{t(descKey, description)}</p>
      </div>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center">
          <span className="text-4xl font-bold">{getDisplayPrice()}</span>
          <span className="text-gray-500 ml-2">{isHomepage ? "/ month" : "total"}</span>
        </div>
        <div className="flex items-center justify-center mt-2">
          <span className="text-sm text-gray-500 line-through">{getRegularPrice()}</span>
          <span className="text-xs text-primary ml-2">{t(currentKey, "Current Price")}</span>
        </div>
        {isHomepage && (
          <div className="text-sm text-gray-500 mt-1">
            Billed as {getTotalPrice()} for {billingPeriod === "6month" ? "6" : "12"} months
          </div>
        )}
        {!isHomepage && (
          <div className="text-sm text-gray-500 mt-1">
            ($
            {plan === "standard"
              ? billingPeriod === "6month"
                ? "199"
                : "159"
              : billingPeriod === "6month"
                ? "399"
                : "319"}
            /month for {billingPeriod === "6month" ? "6" : "12"} months)
          </div>
        )}
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
            <span dangerouslySetInnerHTML={{ __html: t(featureKeys[index], feature) }} />
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <Button
          asChild
          className={`w-full ${
            popular
              ? "bg-primary hover:bg-primary/90"
              : "bg-white text-primary border border-primary hover:bg-primary/10"
          }`}
          variant={popular ? "default" : "outline"}
        >
          <Link href={`/payment?plan=${plan}&period=${billingPeriod}`}>{t("pricing_cta", "Subscribe Now")}</Link>
        </Button>
      </div>
    </div>
  )
}
