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

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section id="features" className="py-32 px-6 lg:px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Metrics Section - Like Giga's "DWR RATE 80%" */}
        <div
          className={`mb-16 transition-all duration-500 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="text-sm text-foreground/50 mb-2">Enterprise Metrics</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {metrics.map((metric, index) => (
              <div key={index}>
                <div className="text-4xl font-light text-foreground mb-2">{metric.value}</div>
                <div className="text-sm text-foreground/50">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features List - Minimal */}
        <div
          className={`space-y-12 transition-all duration-500 delay-200 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div>
            <h3 className="text-2xl font-light text-foreground mb-3">Private by Default</h3>
            <p className="text-foreground/60 leading-relaxed">
              All data stays within your infrastructure. Zero external API calls. Complete data sovereignty.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-light text-foreground mb-3">Enterprise-Grade Security</h3>
            <p className="text-foreground/60 leading-relaxed">
              SOC2 Type II certified. End-to-end encryption. Complete audit trails. GDPR compliant.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-light text-foreground mb-3">Multi-LLM Support</h3>
            <p className="text-foreground/60 leading-relaxed">
              Deploy OpenAI, Claude, Llama, or custom LLMs. Unified interface, your choice of model.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
