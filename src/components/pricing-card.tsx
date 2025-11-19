"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

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
  return (
    <div
      className={`relative rounded-2xl border-2 p-8 ${
        popular
          ? "border-primary bg-gradient-to-b from-primary/5 to-white shadow-lg"
          : "border-slate-200 bg-white"
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <p className="text-slate-500 mt-1">{description}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">${earlyAdopterPriceUSD}</span>
            <span className="text-slate-500 line-through">${priceUSD}</span>
            <span className="text-sm text-slate-500">/month</span>
          </div>
          <p className="text-sm text-green-600 font-medium">Early Adopter Pricing</p>
        </div>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-600">{feature}</span>
            </li>
          ))}
        </ul>
        <Link href={`/auth/signup?plan=${plan}`} className="block">
          <Button className="w-full" variant={popular ? "default" : "outline"}>
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  )
}

