"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Shield, Zap, Lock, Brain, Gauge, Code2, Database, Users } from "lucide-react"
import { useEffect, useState } from "react"

const features = [
  {
    title: "Private by Default",
    description: "All data stays within your infrastructure. Zero external API calls.",
    icon: Shield,
  },
  {
    title: "No-Code Agent Builder",
    description: "Intuitive interface for building sophisticated AI assistants.",
    icon: Zap,
  },
  {
    title: "Granular Access Control",
    description: "Scoped data permissions with role-based access.",
    icon: Lock,
  },
  {
    title: "Multi-LLM Support",
    description: "Deploy OpenAI, Claude, Llama, or custom LLMs.",
    icon: Brain,
  },
  {
    title: "Real-time Analytics",
    description: "Monitor agent activity and performance metrics.",
    icon: Gauge,
  },
  {
    title: "API-First Architecture",
    description: "Comprehensive REST & GraphQL APIs for integration.",
    icon: Code2,
  },
  {
    title: "Enterprise Database",
    description: "Connect to PostgreSQL, MySQL, MongoDB, and more.",
    icon: Database,
  },
  {
    title: "Team Collaboration",
    description: "Role-based teams and collaborative workflows.",
    icon: Users,
  },
]

export default function FeatureHighlights() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section id="features" className="py-24 px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div
            className={`inline-block mb-4 px-3 py-1 rounded-md border border-border bg-muted/50 text-xs font-medium text-foreground/70 transition-all duration-500 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            Features
          </div>
          <h2
            className={`text-3xl sm:text-4xl font-semibold text-foreground mb-4 tracking-tight transition-all duration-500 delay-75 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Everything you need
          </h2>
          <p
            className={`text-lg text-foreground/60 max-w-2xl mx-auto transition-all duration-500 delay-150 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Enterprise-grade features designed for security, scale, and performance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`transition-all duration-500 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${200 + index * 50}ms` }}
              >
                <Card className="p-6 h-full bg-card border-border hover:border-border/80 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-foreground/70" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{feature.description}</p>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
