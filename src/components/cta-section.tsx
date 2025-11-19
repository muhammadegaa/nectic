"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Mail, Check } from "lucide-react"

export default function CtaSection() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setEmail("")
      setSubmitted(false)
    }, 3000)
  }

  return (
    <section id="contact" className="py-24 px-6 lg:px-8 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <Card
          className={`p-12 bg-card border-border transition-all duration-500 ${
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="text-center">
            <h2
              className={`text-3xl sm:text-4xl font-semibold text-foreground mb-4 tracking-tight transition-all duration-500 delay-100 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Ready to get started?
            </h2>
            <p
              className={`text-lg text-foreground/60 mb-8 transition-all duration-500 delay-200 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Join leading enterprises building the future of internal AI.
            </p>

            {!submitted ? (
              <form
                onSubmit={handleSubmit}
                className={`flex flex-col sm:flex-row gap-3 max-w-md mx-auto transition-all duration-500 delay-300 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <input
                    type="email"
                    placeholder="your@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="bg-foreground text-background hover:bg-foreground/90 h-12 px-6"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            ) : (
              <div
                className={`bg-muted border border-border rounded-lg p-6 text-center transition-all duration-500 max-w-md mx-auto ${
                  submitted ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-foreground/70" />
                  <p className="font-semibold text-foreground">Thanks for your interest!</p>
                </div>
                <p className="text-sm text-foreground/60">Check your email soon.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  )
}
