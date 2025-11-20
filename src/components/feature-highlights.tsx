"use client"

import type React from "react"
import { useEffect, useState } from "react"

const metrics = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "0", label: "Data Leakage Incidents" },
  { value: "256-bit", label: "Encryption" },
  { value: "SOC2", label: "Type II Certified" },
]

export default function FeatureHighlights() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [counters, setCounters] = useState(metrics.map(() => false))

  useEffect(() => {
    setIsLoaded(true)
    // Animate counters when in view
    const timer = setTimeout(() => {
      setCounters(metrics.map(() => true))
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section id="features" className="py-32 px-6 lg:px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Metrics Section - Like Giga's "DWR RATE 80%" */}
        <div
          className={`mb-16 transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="text-sm text-foreground/50 mb-8">Enterprise Metrics</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ease-out ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl font-light text-foreground mb-2 transition-all duration-500">
                  {metric.value}
                </div>
                <div className="text-sm text-foreground/50">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features List - Minimal */}
        <div
          className={`space-y-16 transition-all duration-700 ease-out delay-200 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="group">
            <h3 className="text-2xl font-light text-foreground mb-3 transition-colors duration-200 group-hover:text-foreground/90">
              Your Data, Your Infrastructure
            </h3>
            <p className="text-foreground/60 leading-relaxed transition-colors duration-200 group-hover:text-foreground/70">
              All data stays in your Firebase. We never store your sensitive information. OpenAI API calls include privacy controls to prevent data retention. Complete data sovereignty.
            </p>
          </div>
          <div className="group">
            <h3 className="text-2xl font-light text-foreground mb-3 transition-colors duration-200 group-hover:text-foreground/90">
              Zero Cross-User Contamination
            </h3>
            <p className="text-foreground/60 leading-relaxed transition-colors duration-200 group-hover:text-foreground/70">
              Server-side authentication and Firestore security rules ensure users can only access their own data. Every API request is verified. No data leakage between users or organizations.
            </p>
          </div>
          <div className="group">
            <h3 className="text-2xl font-light text-foreground mb-3 transition-colors duration-200 group-hover:text-foreground/90">
              Multi-LLM Support
            </h3>
            <p className="text-foreground/60 leading-relaxed transition-colors duration-200 group-hover:text-foreground/70">
              Deploy OpenAI, Claude, Llama, or custom LLMs. Unified interface, your choice of model.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
