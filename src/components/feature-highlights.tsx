"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Shield, Zap, Lock, Code2, Gauge, Brain } from "lucide-react"
import { useEffect, useState, useRef } from "react"

const features = [
  {
    title: "Private by Default",
    description: "All data stays within your infrastructure. No external API calls.",
    icon: Shield,
  },
  {
    title: "No-Code Agent Setup",
    description: "Intuitive interface for building sophisticated AI assistants.",
    icon: Zap,
  },
  {
    title: "Scoped Data Access",
    description: "Granular permission controls limit what data each agent accesses.",
    icon: Lock,
  },
  {
    title: "LLM Ready",
    description: "Bring your own model. Deploy OpenAI, Claude, Llama, or custom LLMs.",
    icon: Brain,
  },
  {
    title: "Real-time Monitoring",
    description: "Monitor agent activity and query performance in real-time dashboards.",
    icon: Gauge,
  },
  {
    title: "API First",
    description: "Comprehensive REST & GraphQL APIs for seamless integration.",
    icon: Code2,
  },
]

export default function FeatureHighlights() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
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
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className={`text-4xl sm:text-5xl font-bold text-foreground mb-4 text-balance transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            Powerful Features
          </h2>
          <p
            className={`text-lg text-foreground/60 max-w-2xl mx-auto transition-all duration-700 delay-100 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            Everything needed to build, deploy, and manage secure AI assistants
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${100 + index * 50}ms` }}
              >
                <Card
                  ref={(el) => {
                    cardRefs.current[index] = el
                  }}
                  onMouseMove={(e) => handleMouseMove(e, index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  className="p-6 bg-background border border-accent/20 hover:border-accent/60 transition-all duration-300 group cursor-default relative overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(600px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), rgba(251, 146, 60, 0.15), transparent 80%)",
                    }}
                  />

                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center mb-4 group-hover:from-accent/60 group-hover:to-primary/40 transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg group-hover:shadow-accent/50">
                      <Icon className="w-6 h-6 text-accent group-hover:text-secondary transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-accent transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-foreground/60 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
