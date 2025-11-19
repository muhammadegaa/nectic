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
          className={`transition-all duration-500 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="text-sm text-foreground/50 mb-8">Compliance & Certifications</div>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-2xl font-light text-foreground mb-2">SOC2 Type II</div>
              <div className="text-sm text-foreground/50">Certified for security and availability</div>
            </div>
            <div>
              <div className="text-2xl font-light text-foreground mb-2">GDPR</div>
              <div className="text-sm text-foreground/50">Full data residency support</div>
            </div>
            <div>
              <div className="text-2xl font-light text-foreground mb-2">HIPAA</div>
              <div className="text-sm text-foreground/50">Healthcare compliance ready</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
