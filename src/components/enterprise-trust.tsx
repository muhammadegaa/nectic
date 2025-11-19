"use client"

import type React from "react"
import { useEffect, useState } from "react"

export default function EnterpriseTrust() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section id="security" className="py-32 px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div
          className={`transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="text-sm text-foreground/50 mb-8">Compliance & Certifications</div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "SOC2 Type II", description: "Certified for security and availability" },
              { title: "GDPR", description: "Full data residency support" },
              { title: "HIPAA", description: "Healthcare compliance ready" },
            ].map((item, index) => (
              <div
                key={index}
                className={`group transition-all duration-700 ease-out ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-2xl font-light text-foreground mb-2 transition-colors duration-200 group-hover:text-foreground/90">
                  {item.title}
                </div>
                <div className="text-sm text-foreground/50 transition-colors duration-200 group-hover:text-foreground/60">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
