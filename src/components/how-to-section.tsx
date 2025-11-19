"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ArrowRight } from "lucide-react"

const steps = [
  {
    number: 1,
    title: "Create Your Agent",
    description: "Define your AI agent's name, select data collections, and configure intent mappings.",
    details: "Choose which databases your agent can access (Finance, Sales, HR) and map keywords to specific collections.",
  },
  {
    number: 2,
    title: "Configure Intent Mappings",
    description: "Map user questions to specific data collections using keywords.",
    details: "For example, map 'revenue' and 'income' keywords to Finance Transactions collection.",
  },
  {
    number: 3,
    title: "Start Chatting",
    description: "Ask questions in natural language and get instant answers from your data.",
    details: "Your agent will automatically detect intent, query relevant collections, and generate human-readable responses.",
  },
  {
    number: 4,
    title: "Manage & Iterate",
    description: "Edit agent configurations, add new collections, or refine intent mappings as needed.",
    details: "Continuously improve your agent's accuracy by updating its configuration based on usage patterns.",
  },
]

export default function HowToSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section id="how-to" className="py-32 px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className={`text-5xl font-light text-foreground mb-4 transition-all duration-700 ease-out ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            How to Get Started
          </h2>
          <p
            className={`text-xl text-foreground/60 max-w-2xl mx-auto transition-all duration-700 ease-out delay-100 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Build your first AI agent in minutes. Follow these simple steps to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {steps.map((step, index) => (
            <Card
              key={step.number}
              className={`hover:border-foreground/20 transition-all duration-300 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${150 + index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center text-foreground font-medium">
                    {step.number}
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </div>
                <CardDescription className="text-base">{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/60 leading-relaxed">{step.details}</p>
                <div className="flex items-center mt-4 text-sm text-foreground/60">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-foreground/40" />
                  <span>Step {step.number} of {steps.length}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div
          className={`mt-12 text-center transition-all duration-700 ease-out delay-500 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <a
            href="/auth/signup"
            className="inline-flex items-center text-foreground hover:text-foreground/80 transition-colors"
          >
            Get started now
            <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </div>
      </div>
    </section>
  )
}

