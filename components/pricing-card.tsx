"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCurrency } from "@/lib/currency-context"
import { formatCurrency } from "@/lib/currency-utils"

interface PricingCardProps {
  title: string
  description: string
  priceUSD: number
  earlyAdopterPriceUSD: number
  features: string[]
  plan: "standard" | "premium"
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
  const { currency } = useCurrency()

  // Format the prices based on the selected currency
  const formattedRegularPrice = formatCurrency(priceUSD, currency)
  const formattedEarlyAdopterPrice = formatCurrency(earlyAdopterPriceUSD, currency)

  return (
    <div
      className={`relative flex flex-col p-6 bg-white shadow-lg rounded-lg border ${
        popular ? "border-primary" : "border-gray-200"
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-gray-500 mt-2">{description}</p>
      </div>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center">
          <span className="text-4xl font-bold">{formattedEarlyAdopterPrice}</span>
          <span className="text-gray-500 ml-2">/ month</span>
        </div>
        <div className="flex items-center justify-center mt-2">
          <span className="text-sm text-gray-500 line-through">{formattedRegularPrice}</span>
          <span className="text-xs text-primary ml-2">Early Adopter Price</span>
        </div>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
            <span dangerouslySetInnerHTML={{ __html: feature }} />
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
          <Link href={`/payment?plan=${plan}`}>Get Early Access</Link>
        </Button>
      </div>
    </div>
  )
}
