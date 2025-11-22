"use client"

import type React from "react"
import { useEffect, useState } from "react"

const customers = [
  { name: "TechCorp", logo: null },
  { name: "DataFlow", logo: null },
  { name: "FinanceHub", logo: null },
  { name: "CloudScale", logo: null },
  { name: "EnterpriseAI", logo: null },
]

export default function CustomerLogosSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="py-16 px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div
          className={`transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="text-center mb-8">
            <p className="text-sm text-foreground/50 mb-6">Trusted by innovative teams</p>
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12 opacity-60">
              {customers.map((customer, index) => (
                <div
                  key={index}
                  className={`text-lg font-medium text-foreground/40 hover:text-foreground/60 transition-colors ${
                    isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  {customer.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

