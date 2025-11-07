"use client"

import { TrendingUp, Timer, Target, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Opportunity } from "@/lib/opportunities-service"

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "—"
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return currency.format(value)
}

function formatHours(value: number) {
  if (!Number.isFinite(value)) return "—"
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K hrs`
  return `${Math.round(value)} hrs`
}

export function InsightMetrics({ opportunities }: { opportunities: Opportunity[] }) {
  const totalSavings = opportunities.reduce((sum, item) => sum + (item.monthlySavings || 0), 0)
  const totalHours = opportunities.reduce((sum, item) => sum + (item.timeSavedHours || 0), 0)
  const enterpriseGrade = opportunities.filter((item) => (item.impactScore || 0) >= 75)
  const quickWins = opportunities.filter((item) => item.quickWin || (item.implementationEffort || 0) <= 2)

  const metrics = [
    {
      id: 1,
      label: "Projected annual ROI",
      value: formatCurrency(totalSavings * 12),
      helper: "Based on automation-ready opportunities identified so far",
      icon: TrendingUp,
      accent: "bg-emerald-100 text-emerald-700",
    },
    {
      id: 2,
      label: "Hours freed per month",
      value: formatHours(totalHours),
      helper: "High-volume manual steps ready for intelligent automation",
      icon: Timer,
      accent: "bg-amber-100 text-amber-700",
    },
    {
      id: 3,
      label: "Enterprise-ready initiatives",
      value: `${enterpriseGrade.length}`,
      helper: "Opportunities with 70%+ data confidence and compliance coverage",
      icon: Target,
      accent: "bg-blue-100 text-blue-700",
    },
    {
      id: 4,
      label: "Quick win pilots",
      value: `${quickWins.length}`,
      helper: "Low-effort automations to validate value in 30 days",
      icon: Users,
      accent: "bg-slate-200 text-slate-800",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.id} className="border border-slate-200/80 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${metric.accent}`}>
                <Icon className="h-4 w-4" />
                {metric.label}
              </div>
              <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
              <p className="text-xs text-slate-500 leading-snug">{metric.helper}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
