"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Zap, Settings, Database, Lock } from "lucide-react"
import { useEffect, useState, useRef } from "react"

const steps = [
  {
    number: 1,
    title: "Create Agent",
    description: "Define your AI agent with custom instructions and personality.",
    icon: Zap,
  },
  {
    number: 2,
    title: "Define Logic",
    description: "Configure decision trees and response logic with precision control.",
    icon: Settings,
  },
  {
    number: 3,
    title: "Connect Data",
    description: "Securely connect your private databases with scoped access.",
    icon: Database,
  },
  {
    number: 4,
    title: "Chat Securely",
    description: "Deploy and start chatting with end-to-end encryption.",
    icon: Lock,
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
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div
          className="absolute bottom-0 right-1/3 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className={`text-4xl sm:text-5xl font-bold text-foreground mb-4 text-balance transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            How It Works
          </h2>
          <p
            className={`text-lg text-foreground/60 max-w-2xl mx-auto transition-all duration-700 delay-100 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            Build a secure AI assistant in four simple steps
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${100 + index * 100}ms` }}
              >
                <Card
                  ref={(el) => {
                    cardRefs.current[index] = el
                  }}
                  onMouseMove={(e) => handleMouseMove(e, index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  className="p-6 h-full bg-background border border-accent/20 hover:border-primary/60 transition-all duration-300 group cursor-default relative overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(600px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), rgba(251, 146, 60, 0.15), transparent 80%)",
                    }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center group-hover:from-accent/50 group-hover:to-primary/40 transition-all duration-300 group-hover:scale-110">
                        <Icon className="w-6 h-6 text-accent" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm border border-primary/50 group-hover:border-accent group-hover:bg-accent/20 group-hover:text-accent transition-all duration-300 group-hover:shadow-lg group-hover:shadow-accent/40">
                        {step.number}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-accent transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-foreground/60 text-sm leading-relaxed">{step.description}</p>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 w-6 h-0.5 bg-gradient-to-r from-accent/50 to-transparent" />
                  )}
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
