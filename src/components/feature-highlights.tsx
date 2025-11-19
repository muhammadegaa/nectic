"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Shield, Zap, Lock, Code2, Gauge, Brain, Database, Users } from "lucide-react"
import { useEffect, useState, useRef } from "react"

const features = [
  {
    title: "Private by Default",
    description: "All data stays within your infrastructure. Zero external API calls. Complete data sovereignty.",
    icon: Shield,
    gradient: "from-primary/30 to-primary/10",
    iconColor: "text-primary",
    highlight: "Enterprise",
  },
  {
    title: "No-Code Agent Builder",
    description: "Intuitive visual interface for building sophisticated AI assistants without writing a single line of code.",
    icon: Zap,
    gradient: "from-accent/30 to-accent/10",
    iconColor: "text-accent",
    highlight: "Fast Setup",
  },
  {
    title: "Granular Access Control",
    description: "Scoped data permissions with role-based access. Limit what each agent can see and do.",
    icon: Lock,
    gradient: "from-primary/30 to-accent/10",
    iconColor: "text-primary",
    highlight: "Security",
  },
  {
    title: "Multi-LLM Support",
    description: "Bring your own model. Deploy OpenAI, Claude, Llama, or custom LLMs with unified interface.",
    icon: Brain,
    gradient: "from-secondary/30 to-secondary/10",
    iconColor: "text-secondary",
    highlight: "Flexible",
  },
  {
    title: "Real-time Analytics",
    description: "Monitor agent activity, query performance, and usage metrics with comprehensive dashboards.",
    icon: Gauge,
    gradient: "from-accent/30 to-primary/10",
    iconColor: "text-accent",
    highlight: "Insights",
  },
  {
    title: "API-First Architecture",
    description: "Comprehensive REST & GraphQL APIs for seamless integration with your existing stack.",
    icon: Code2,
    gradient: "from-primary/30 to-secondary/10",
    iconColor: "text-primary",
    highlight: "Developer",
  },
  {
    title: "Enterprise Database",
    description: "Connect to PostgreSQL, MySQL, MongoDB, and more. Native support for all major databases.",
    icon: Database,
    gradient: "from-accent/30 to-accent/10",
    iconColor: "text-accent",
    highlight: "Compatible",
  },
  {
    title: "Team Collaboration",
    description: "Role-based teams, shared workspaces, and collaborative agent development workflows.",
    icon: Users,
    gradient: "from-secondary/30 to-primary/10",
    iconColor: "text-secondary",
    highlight: "Collaborative",
  },
]

export default function FeatureHighlights() {
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
    <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div
          className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div
            className={`inline-block mb-4 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold transition-all duration-700 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            POWERFUL FEATURES
          </div>
          <h2
            className={`text-5xl sm:text-6xl font-extrabold text-foreground mb-6 text-balance transition-all duration-700 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Everything You Need
            <span className="block mt-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              To Build Secure AI
            </span>
          </h2>
          <p
            className={`text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-100 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Enterprise-grade features designed for security, scale, and performance. Built by developers, for
            developers.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${150 + index * 50}ms` }}
              >
                <Card
                  ref={(el) => {
                    cardRefs.current[index] = el
                  }}
                  onMouseMove={(e) => handleMouseMove(e, index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  className="group relative h-full p-6 bg-gradient-to-br from-background via-background to-background border-2 border-primary/10 hover:border-primary/40 transition-all duration-500 cursor-default overflow-hidden"
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
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}
                      >
                        <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                        {feature.highlight}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-foreground/70 text-sm leading-relaxed">{feature.description}</p>
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
