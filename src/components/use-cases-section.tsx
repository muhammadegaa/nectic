"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, TrendingUp, Users, Shield } from "lucide-react"

const useCases = [
  {
    icon: Database,
    title: "Financial Analytics",
    description: "Get instant insights into revenue, expenses, and financial performance.",
    example: "What's our total revenue this quarter?",
    collections: ["Finance Transactions"],
  },
  {
    icon: TrendingUp,
    title: "Sales Intelligence",
    description: "Track deals, pipeline health, and sales performance in real-time.",
    example: "Show me all deals closing this month",
    collections: ["Sales Deals"],
  },
  {
    icon: Users,
    title: "HR Analytics",
    description: "Answer questions about employees, departments, and organizational structure.",
    example: "How many engineers are in the product team?",
    collections: ["HR Employees"],
  },
  {
    icon: Shield,
    title: "Compliance & Reporting",
    description: "Generate compliance reports and audit trails from your data.",
    example: "List all transactions above $10,000",
    collections: ["Finance Transactions", "Sales Deals"],
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
        <div className="text-center mb-16">
          <h2
            className={`text-5xl font-light text-foreground mb-4 transition-all duration-700 ease-out ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Enterprise Use Cases
          </h2>
          <p
            className={`text-xl text-foreground/60 max-w-2xl mx-auto transition-all duration-700 ease-out delay-100 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            See how Nectic transforms data access across your organization.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon
            return (
              <Card
                key={index}
                className={`hover:border-foreground/20 transition-all duration-300 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: `${150 + index * 100}ms` }}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <CardTitle className="text-lg mb-2">{useCase.title}</CardTitle>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-foreground/60 mb-1">Example Question:</p>
                      <p className="text-sm text-foreground/80 italic">"{useCase.example}"</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground/60 mb-1">Data Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {useCase.collections.map((col, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-muted rounded text-foreground/70"
                          >
                            {col.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

