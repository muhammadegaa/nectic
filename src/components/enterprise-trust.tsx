"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Shield, Lock, FileCheck, Globe, Key } from "lucide-react"
import { useEffect, useState } from "react"

const badges = [
  {
    title: "Private Deployment",
    description: "Deploy on your infrastructure or private cloud.",
    icon: Shield,
  },
  {
    title: "SOC2 Type II",
    description: "Certified for security, availability, and confidentiality.",
    icon: FileCheck,
  },
  {
    title: "Zero Data Leakage",
    description: "Cryptographic guarantees of data isolation.",
    icon: Lock,
  },
  {
    title: "Complete Audit Trails",
    description: "Every query logged and traceable.",
    icon: FileCheck,
  },
  {
    title: "GDPR Compliant",
    description: "Full support for data residency requirements.",
    icon: Globe,
  },
  {
    title: "End-to-End Encryption",
    description: "AES-256 encryption for all data.",
    icon: Key,
  },
]

const companies = [
  { name: "Fortune 500", count: "50+" },
  { name: "Healthcare", count: "100+" },
  { name: "FinTech", count: "200+" },
  { name: "Tech", count: "500+" },
]

export default function EnterpriseTrust() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section id="security" className="py-24 px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div
            className={`inline-block mb-4 px-3 py-1 rounded-md border border-border bg-muted/50 text-xs font-medium text-foreground/70 transition-all duration-500 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            Security
          </div>
          <h2
            className={`text-3xl sm:text-4xl font-semibold text-foreground mb-4 tracking-tight transition-all duration-500 delay-75 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Security built from the ground up
          </h2>
          <p
            className={`text-lg text-foreground/60 max-w-2xl mx-auto transition-all duration-500 delay-150 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Every feature designed with security and compliance at the core.
          </p>
        </div>

        {/* Security Badges */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {badges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <div
                key={index}
                className={`transition-all duration-500 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${200 + index * 50}ms` }}
              >
                <Card className="p-6 bg-card border-border">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-foreground/70" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-foreground/50" />
                        <h3 className="font-semibold text-foreground">{badge.title}</h3>
                      </div>
                      <p className="text-sm text-foreground/60">{badge.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>

        {/* Trust Indicators */}
        <div
          className={`pt-12 border-t border-border transition-all duration-500 delay-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-center text-sm text-foreground/50 mb-8 font-medium">Trusted by leading enterprises</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {companies.map((company, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-semibold text-foreground mb-1">{company.count}</div>
                <div className="text-sm text-foreground/50">{company.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
