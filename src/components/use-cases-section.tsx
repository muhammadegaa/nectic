"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, TrendingUp, Users, Shield, FileText, BarChart3, AlertTriangle } from "lucide-react"

const useCases = [
  {
    icon: FileText,
    title: "Financial Reporting & Compliance",
    description: "Automate complex financial reporting workflows across multiple systems and data sources.",
    problem: "Finance teams spend hours aggregating data from ERP, accounting systems, and spreadsheets to generate monthly reports.",
    solution: "Ask 'What's our Q4 revenue breakdown by region?' and get instant, accurate reports with data from all sources.",
    workflows: ["Multi-system data aggregation", "Real-time compliance checks", "Automated report generation"],
    impact: "Reduce reporting time from 8 hours to 5 minutes",
  },
  {
    icon: TrendingUp,
    title: "Sales Pipeline Intelligence",
    description: "Get instant insights across complex sales workflows, forecasting, and deal analysis.",
    problem: "Sales leaders struggle to get real-time visibility into pipeline health across territories, products, and time periods.",
    solution: "Query 'Show me all deals at risk in EMEA this quarter' and get actionable insights with context from CRM, forecasting tools, and historical data.",
    workflows: ["Cross-territory pipeline analysis", "Deal risk assessment", "Forecast accuracy tracking"],
    impact: "Identify at-risk deals 3x faster, improve forecast accuracy by 25%",
  },
  {
    icon: Users,
    title: "HR Analytics & Workforce Planning",
    description: "Answer complex workforce questions spanning recruitment, retention, and organizational planning.",
    problem: "HR teams need to analyze employee data across multiple dimensions: departments, locations, tenure, performance, and compensation.",
    solution: "Ask 'What's our attrition rate for senior engineers in the last 6 months?' and get comprehensive analysis with trends and recommendations.",
    workflows: ["Multi-dimensional workforce analysis", "Retention risk identification", "Compensation benchmarking"],
    impact: "Reduce time to insights from days to seconds",
  },
  {
    icon: Shield,
    title: "Audit & Compliance Automation",
    description: "Streamline complex audit workflows and compliance reporting across regulations.",
    problem: "Compliance teams manually review thousands of transactions and documents to ensure regulatory adherence.",
    solution: "Query 'Show all transactions above $50k that require approval' and get instant compliance reports with audit trails.",
    workflows: ["Regulatory compliance checks", "Transaction monitoring", "Audit trail generation"],
    impact: "Reduce audit preparation time by 70%",
  },
  {
    icon: BarChart3,
    title: "Cross-Functional Business Intelligence",
    description: "Break down data silos and get answers that span finance, sales, operations, and HR.",
    problem: "Executives need insights that combine data from multiple departments, but each system is isolated.",
    solution: "Ask 'What's the revenue per employee by department?' and get answers combining finance, HR, and sales data automatically.",
    workflows: ["Cross-departmental analysis", "Unified business metrics", "Executive dashboards"],
    impact: "Enable data-driven decisions across the entire organization",
  },
  {
    icon: AlertTriangle,
    title: "Risk Management & Anomaly Detection",
    description: "Identify risks and anomalies across complex operational workflows in real-time.",
    problem: "Risk teams monitor multiple data sources manually, missing critical patterns and anomalies.",
    solution: "Query 'Show unusual spending patterns this month' and get instant risk analysis with flagged anomalies and recommendations.",
    workflows: ["Real-time anomaly detection", "Risk pattern analysis", "Automated alerting"],
    impact: "Detect risks 10x faster, prevent costly incidents",
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
            className={`text-xl text-foreground/60 max-w-3xl mx-auto transition-all duration-700 ease-out delay-100 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Transform complex enterprise workflows with AI that understands your business context and data relationships.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon
            return (
              <Card
                key={index}
                className={`hover:border-foreground/20 transition-all duration-300 h-full flex flex-col ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: `${150 + index * 100}ms` }}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <CardTitle className="text-lg mb-2">{useCase.title}</CardTitle>
                  <CardDescription className="text-sm">{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-foreground/60 mb-1">The Challenge</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{useCase.problem}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground/60 mb-1">Nectic Solution</p>
                    <p className="text-sm text-foreground/80 leading-relaxed italic">"{useCase.solution}"</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground/60 mb-2">Complex Workflows</p>
                    <div className="flex flex-wrap gap-1.5">
                      {useCase.workflows.map((workflow, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-muted rounded text-foreground/70"
                        >
                          {workflow}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-foreground/90">{useCase.impact}</p>
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
