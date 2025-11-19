"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Shield, Lock, FileCheck, Globe, Key } from "lucide-react"
import { useEffect, useState, useRef } from "react"

const badges = [
  {
    title: "Private Deployment",
    description: "Deploy on your infrastructure or private cloud. Full control, zero vendor lock-in.",
    icon: Shield,
    gradient: "from-primary/30 to-primary/10",
  },
  {
    title: "SOC2 Type II",
    description: "Certified for security, availability, and confidentiality. Annual audits included.",
    icon: FileCheck,
    gradient: "from-accent/30 to-accent/10",
  },
  {
    title: "Zero Data Leakage",
    description: "Cryptographic guarantees of data isolation. Your data never leaves your control.",
    icon: Lock,
    gradient: "from-primary/30 to-accent/10",
  },
  {
    title: "Complete Audit Trails",
    description: "Every query logged and traceable. Compliance-ready reporting out of the box.",
    icon: FileCheck,
    gradient: "from-secondary/30 to-secondary/10",
  },
  {
    title: "GDPR Compliant",
    description: "Full support for data residency requirements and right-to-be-forgotten requests.",
    icon: Globe,
    gradient: "from-accent/30 to-primary/10",
  },
  {
    title: "End-to-End Encryption",
    description: "Military-grade AES-256 encryption for all data in transit and at rest.",
    icon: Key,
    gradient: "from-primary/30 to-secondary/10",
  },
]

const companies = [
  { name: "Fortune 500", count: "50+" },
  { name: "Healthcare Leaders", count: "100+" },
  { name: "FinTech Giants", count: "200+" },
  { name: "Tech Innovators", count: "500+" },
]

export default function EnterpriseTrust() {
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
    <section id="security" className="py-32 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute -bottom-1/2 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
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
            ENTERPRISE SECURITY
          </div>
          <h2
            className={`text-5xl sm:text-6xl font-extrabold text-foreground mb-6 text-balance transition-all duration-700 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Security Built
            <span className="block mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              From the Ground Up
            </span>
          </h2>
          <p
            className={`text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-100 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Every feature designed with security and compliance at the core. Trusted by enterprises handling
            sensitive data.
          </p>
        </div>

        {/* Security Badges */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {badges.map((badge, index) => {
            const Icon = badge.icon
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
                  className="group relative p-6 bg-gradient-to-br from-background via-background to-background border-2 border-primary/10 hover:border-primary/40 transition-all duration-500 cursor-default overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(600px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), rgba(251, 146, 60, 0.15), transparent 80%)",
                    }}
                  />

                  <div className="relative z-10 flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg`}
                      >
                        <Icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                          {badge.title}
                        </h3>
                      </div>
                      <p className="text-foreground/70 text-sm leading-relaxed">{badge.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>

        {/* Trust Indicators */}
        <div
          className={`pt-12 border-t-2 border-primary/20 transition-all duration-700 delay-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-center text-foreground/50 text-sm mb-10 font-semibold uppercase tracking-wider">
            Trusted by Leading Enterprises
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {companies.map((company, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-background via-background to-primary/5 border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group"
              >
                <div className="text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                  {company.count}
                </div>
                <div className="text-sm text-foreground/60 font-medium">{company.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
