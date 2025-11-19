"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Zap, Database, Settings, Lock } from "lucide-react"
import { useEffect, useState } from "react"

const steps = [
  {
    number: "01",
    title: "Create Agent",
    description: "Define your AI agent with custom instructions and behavior. No coding required.",
    icon: Zap,
  },
  {
    number: "02",
    title: "Connect Data",
    description: "Securely connect your private databases with granular access controls.",
    icon: Database,
  },
  {
    number: "03",
    title: "Configure Logic",
    description: "Set up decision trees and business rules with precision control.",
    icon: Settings,
  },
  {
    number: "04",
    title: "Deploy Securely",
    description: "Launch with end-to-end encryption and enterprise-grade security.",
    icon: Lock,
  },
]

export default function HowItWorks() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section id="how-it-works" className="py-24 px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div
            className={`inline-block mb-4 px-3 py-1 rounded-md border border-border bg-muted/50 text-xs font-medium text-foreground/70 transition-all duration-500 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            How it works
          </div>
          <h2
            className={`text-3xl sm:text-4xl font-semibold text-foreground mb-4 tracking-tight transition-all duration-500 delay-75 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Built for enterprise scale
          </h2>
          <p
            className={`text-lg text-foreground/60 max-w-2xl mx-auto transition-all duration-500 delay-150 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Deploy secure AI assistants in four simple steps. No infrastructure management, no security compromises.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className={`transition-all duration-500 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${200 + index * 100}ms` }}
              >
                <Card className="p-6 h-full bg-card border-border hover:border-border/80 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="w-6 h-6 text-foreground/70" />
                    </div>
                    <span className="text-2xl font-semibold text-foreground/20">{step.number}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{step.description}</p>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
