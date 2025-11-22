"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Quote } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CTO, TechCorp",
    company: "TechCorp",
    content: "Nectic transformed how our team accesses data. What used to take hours of SQL queries now takes seconds with natural language.",
    avatar: "SC"
  },
  {
    name: "Michael Rodriguez",
    role: "VP of Operations, DataFlow Inc",
    company: "DataFlow Inc",
    content: "The security model is exactly what we needed. Our data stays in our infrastructure, and we have complete audit trails.",
    avatar: "MR"
  },
  {
    name: "Emily Watson",
    role: "Head of Analytics, FinanceHub",
    company: "FinanceHub",
    content: "We've reduced reporting time by 90%. Our finance team can now get instant insights without waiting for IT.",
    avatar: "EW"
  }
]

export default function TestimonialsSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="py-32 px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div
          className={`transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="text-center mb-16">
            <div className="text-sm text-foreground/50 mb-4">Trusted by Teams</div>
            <h2 className="text-4xl sm:text-5xl font-light text-foreground mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
              See how teams are using Nectic to transform their data workflows
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`group p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-all duration-300 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Quote className="w-6 h-6 text-primary/40 mb-4" />
                <p className="text-sm text-foreground/80 leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-foreground">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{testimonial.name}</div>
                    <div className="text-xs text-foreground/60">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

