"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Zap, Settings, Database, Lock, ArrowRight } from "lucide-react"
import { useEffect, useState, useRef } from "react"

const steps = [
  {
    number: 1,
    title: "Create Agent",
    description: "Define your AI agent with custom instructions, personality, and behavior. No coding required.",
    icon: Zap,
    gradient: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
  {
    number: 2,
    title: "Connect Data",
    description: "Securely connect your private databases with granular access controls and scoped permissions.",
    icon: Database,
    gradient: "from-accent/20 to-accent/5",
    iconColor: "text-accent",
  },
  {
    number: 3,
    title: "Configure Logic",
    description: "Set up decision trees, response logic, and business rules with precision control.",
    icon: Settings,
    gradient: "from-secondary/20 to-secondary/5",
    iconColor: "text-secondary",
  },
  {
    number: 4,
    title: "Deploy Securely",
    description: "Launch with end-to-end encryption, audit trails, and enterprise-grade security.",
    icon: Lock,
    gradient: "from-primary/20 to-accent/5",
    iconColor: "text-primary",
  },
]

export default function HowItWorks() {
  const [isLoaded, setIsLoaded] = useState(false)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const card = cardRefs.current[index]
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    card.style.setProperty("--mouse-x", `${x}px`)
    card.style.setProperty("--mouse-y", `${y}px`)
  }

  const handleMouseLeave = (index: number) => {
    const card = cardRefs.current[index]
    if (card) {
      card.style.setProperty("--mouse-x", "-500px")
      card.style.setProperty("--mouse-y", "-500px")
    }
  }

  return (
    <section id="how-it-works" className="py-32 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div
          className="absolute bottom-0 right-1/3 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div
            className={`inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold transition-all duration-700 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            SIMPLE PROCESS
          </div>
          <h2
            className={`text-5xl sm:text-6xl font-extrabold text-foreground mb-6 text-balance transition-all duration-700 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Built for
            <span className="block mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Enterprise Scale
            </span>
          </h2>
          <p
            className={`text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-100 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Deploy secure AI assistants in four simple steps. No infrastructure management, no security
            compromises.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${150 + index * 100}ms` }}
              >
                <Card
                  ref={(el) => {
                    cardRefs.current[index] = el
                  }}
                  onMouseMove={(e) => handleMouseMove(e, index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  className="group relative h-full p-8 bg-gradient-to-br from-background via-background to-background border-2 border-primary/10 hover:border-primary/40 transition-all duration-500 cursor-default overflow-hidden"
                >
                  {/* Hover gradient effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(600px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), rgba(251, 146, 60, 0.15), transparent 80%)",
                    }}
                  />

                  <div className="relative z-10">
                    {/* Icon and Number */}
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl`}
                      >
                        <Icon className={`w-8 h-8 ${step.iconColor}`} />
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border-2 border-primary/30 text-primary flex items-center justify-center font-bold text-lg group-hover:bg-primary/20 group-hover:border-primary/50 group-hover:scale-110 transition-all duration-300">
                        {step.number}
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-foreground/70 text-base leading-relaxed mb-4">
                      {step.description}
                    </p>

                    {/* Arrow indicator */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2">
                        <ArrowRight className="w-6 h-6 text-primary/30 group-hover:text-primary/60 transition-colors duration-300" />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div
          className={`text-center transition-all duration-700 delay-500 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-foreground/60 mb-6">Ready to get started?</p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-primary hover:text-accent font-semibold transition-colors duration-300 group"
          >
            Schedule a demo
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  )
}
