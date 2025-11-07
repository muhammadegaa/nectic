"use client"
import Link from "next/link"
import { Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCurrency } from "@/lib/currency-context"
import { useLanguage } from "@/lib/language-context"

interface PricingCardProps {
  title: string
  description: string
  priceUSD: number
  earlyAdopterPriceUSD: number
  features: string[]
  plan: string
  popular?: boolean
}

export function PricingCard({
  title,
  description,
  priceUSD,
  earlyAdopterPriceUSD,
  features,
  plan,
  popular = false,
}: PricingCardProps) {
  const { formatPrice, isLoading: currencyLoading } = useCurrency()
  const { t, isLoading: languageLoading } = useLanguage()

  const isLoading = currencyLoading || languageLoading

  // Map standard plan or premium plan to translation keys
  const isPremium = plan === "premium"
  const titleKey = isPremium ? "pricing_premium_title" : "pricing_standard_title"
  const descKey = isPremium ? "pricing_premium_desc" : "pricing_standard_desc"

  return (
    <div className="group">
      <Card className={`transition-all duration-300 hover:shadow-md ${popular ? "border-primary relative" : ""}`}>
        {popular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm">
            {t("pricing_most_popular")}
          </div>
        )}
        <CardHeader>
          <CardTitle>{isLoading ? title : t(titleKey)}</CardTitle>
          <CardDescription>{isLoading ? description : t(descKey)}</CardDescription>
          <div className="mt-4 text-4xl font-bold">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              <>
                {formatPrice(priceUSD)}
                <span className="text-sm font-normal text-gray-500">{t("pricing_per_month")}</span>
              </>
            )}
          </div>
          <p className="text-sm text-green-600 mt-2">
            {isLoading ? "..." : t("pricing_early_adopter", { price: formatPrice(earlyAdopterPriceUSD) })}
          </p>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3">
            {features.map((feature, index) => {
              // Map feature to translation key based on plan and index
              const featureKey = isPremium
                ? `pricing_premium_feature_${index + 1}`
                : `pricing_standard_feature_${index + 1}`

              return (
                <li key={index} className="flex items-center gap-2">
                  <div className="flex-shrink-0 rounded-full p-1 bg-green-100">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span dangerouslySetInnerHTML={{ __html: isLoading ? feature : t(featureKey) }} />
                </li>
              )
            })}
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full group relative overflow-hidden" asChild>
            <Link href={`/checkout?plan=${plan}`} className="flex items-center justify-center">
              <span className="relative z-10">{isLoading ? "Secure Early Access" : t("pricing_cta")}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
