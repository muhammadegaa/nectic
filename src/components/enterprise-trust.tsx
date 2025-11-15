"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { useEffect, useState, useRef } from "react"

const badges = [
  {
    title: "Private Deployment",
    description: "Deploy on your infrastructure or private cloud",
  },
  {
    title: "SOC2 Compliant",
    description: "Type II certified for security and availability",
  },
  {
    title: "Zero Data Leakage",
    description: "Cryptographic guarantees of data isolation",
  },
  {
    title: "Audit Ready",
    description: "Complete audit trails and compliance logging",
  },
  {
    title: "GDPR Compliant",
    description: "Full support for data residency requirements",
  },
  {
    title: "End-to-End Encryption",
    description: "Military-grade encryption for all data in transit",
  },
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
    <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
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

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className={`text-4xl sm:text-5xl font-bold text-foreground mb-4 text-balance transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            Enterprise Grade Security
          </h2>
          <p
            className={`text-lg text-foreground/60 max-w-2xl mx-auto transition-all duration-700 delay-100 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            Built from the ground up with security and compliance at the core
          </p>
        </div>

        {/* Security Badges */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {badges.map((badge, index) => (
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
                className="p-6 bg-background border border-accent/20 hover:border-primary/70 transition-all duration-300 group cursor-default relative overflow-hidden"
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
                    <CheckCircle2 className="w-6 h-6 text-primary group-hover:text-accent group-hover:scale-125 transition-all duration-300 mt-0.5 drop-shadow-lg group-hover:drop-shadow-2xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 group-hover:text-accent transition-colors duration-300">
                      {badge.title}
                    </h3>
                    <p className="text-foreground/60 text-sm">{badge.description}</p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div
          className={`pt-12 border-t border-accent/20 transition-all duration-700 delay-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          <p className="text-center text-foreground/50 text-sm mb-8">Trusted by leading enterprises</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {["Fortune 500", "Healthcare Leaders", "FinTech Giants", "Tech Innovators"].map((company, index) => (
              <div
                key={index}
                className="text-foreground/40 font-semibold text-sm hover:text-accent transition-all duration-300 hover:scale-110 cursor-pointer"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
