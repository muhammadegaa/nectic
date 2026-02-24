"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp } from "lucide-react"

const useCases = [
  {
    icon: FileText,
    title: "Spend and burn",
    description: "Finance teams spend 5+ hours a week recreating reports. Ask a question, get the answer.",
    problem: "Gathering data from ERP, accounting systems, and spreadsheets to answer simple questions.",
    solution: "Ask &quot;What&apos;s our burn rate?&quot; or &quot;Top 5 expenses by category?&quot; Get the answer in 30 seconds.",
    impact: "Cut reporting time from hours to seconds.",
  },
  {
    icon: TrendingUp,
    title: "Budget and forecasts",
    description: "No SQL. No dashboards. Just ask.",
    problem: "FP&A spends 42% of time gathering data. The rest is waiting on IT or rebuilding dashboards.",
    solution: "Upload Excel or CSV. Ask &quot;How much did we spend on software?&quot; Done.",
    impact: "Answers in 30 seconds, not days.",
  },
]

export default function UseCasesSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section id="use-cases" className="py-32 px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className={`text-3xl sm:text-4xl font-light text-foreground mb-3 transition-all duration-700 ease-out ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Built for finance teams
          </h2>
          <p
            className={`text-lg text-foreground/60 max-w-xl mx-auto transition-all duration-700 ease-out delay-100 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Spend questions first. Burn rate, top expenses, category breakdown.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon
            return (
              <Card
                key={index}
                className={`hover:border-foreground/20 transition-all duration-300 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${100 + index * 80}ms` }}
              >
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <CardTitle className="text-lg mb-1">{useCase.title}</CardTitle>
                  <CardDescription className="text-sm">{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground/70 leading-relaxed">{useCase.problem}</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{useCase.solution}</p>
                  <p className="text-sm font-medium text-foreground/90">{useCase.impact}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
