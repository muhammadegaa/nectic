"use client"

import Link from "next/link"
import { CheckCircle2, Circle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type MissionControlProps = {
  hasCompletedAssessment: boolean
  hasOpportunities: boolean
  hasActiveSubscription: boolean
}

type MissionStatus = "done" | "in_progress" | "todo"

type MissionStep = {
  id: number
  title: string
  description: string
  cta: { label: string; href: string }
  status: MissionStatus
}

const statusCopy: Record<MissionStatus, { label: string; tone: string }> = {
  done: { label: "Completed", tone: "text-emerald-600" },
  in_progress: { label: "In progress", tone: "text-amber-600" },
  todo: { label: "Next", tone: "text-slate-500" },
}

export function MissionControl({
  hasCompletedAssessment,
  hasOpportunities,
  hasActiveSubscription,
}: MissionControlProps) {
  const missionSteps: MissionStep[] = [
    {
      id: 1,
      title: "Establish your AI baseline",
      description: "Complete the readiness diagnostic so we can benchmark automation potential across teams.",
      cta: { label: "Start diagnostic", href: "/dashboard/assessment" },
      status: hasCompletedAssessment ? "done" : "in_progress",
    },
    {
      id: 2,
      title: "Review your executive briefing",
      description: "Share the AI opportunity brief with your COO or functional leads to align on the quick wins.",
      cta: { label: "Open briefing", href: hasOpportunities ? "/dashboard/opportunities" : "/dashboard" },
      status: hasCompletedAssessment && hasOpportunities ? "done" : hasCompletedAssessment ? "in_progress" : "todo",
    },
    {
      id: 3,
      title: "Secure pilot sponsorship",
      description: "Confirm budget and owners for the top opportunity. Premium unlocks vendor shortlists & ROI tracking.",
      cta: {
        label: hasActiveSubscription ? "View opportunities" : "Upgrade for pilots",
        href: hasActiveSubscription ? "/dashboard" : "/checkout?plan=premium",
      },
      status: hasActiveSubscription ? "in_progress" : hasCompletedAssessment && hasOpportunities ? "todo" : "todo",
    },
  ]

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Badge className="bg-black text-white uppercase tracking-wide">Launch plan</Badge>
            <h2 className="text-2xl font-semibold text-slate-900">
              Operationalize AI in the next 30 days
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl">
              Follow the enterprise onboarding path we use with mid-market transformation teams. Each step is built to
              secure internal alignment and deliver measurable ROI quickly.
            </p>
          </div>
          <div className="rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-medium shadow-lg">
            Built for ops, finance & transformation leaders (50–500 FTE)
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {missionSteps.map((step) => {
            const status = statusCopy[step.status]
            const Icon = step.status === "done" ? CheckCircle2 : Circle

            return (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col gap-4 rounded-xl border border-slate-100 bg-white/80 p-4 transition hover:border-amber-200 md:flex-row md:items-center md:justify-between",
                  step.status === "done" && "bg-emerald-50/70 border-emerald-100",
                  step.status === "in_progress" && "border-amber-200"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={cn(
                      "mt-1 h-5 w-5",
                      step.status === "done" ? "text-emerald-500" : "text-amber-500"
                    )}
                    strokeWidth={step.status === "done" ? 2.5 : 1.5}
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Step {step.id}</p>
                    <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{step.description}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-left md:text-right">
                  <span className={cn("text-xs font-medium uppercase", status.tone)}>{status.label}</span>
                  <Link
                    href={step.cta.href}
                    className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700"
                  >
                    {step.cta.label}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
