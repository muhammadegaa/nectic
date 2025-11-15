"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Mail, Check } from "lucide-react"

export default function CtaSection() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    card.style.setProperty("--mouse-x", `${x}px`)
    card.style.setProperty("--mouse-y", `${y}px`)
  }

  const handleMouseLeave = () => {
    const card = cardRef.current
    if (card) {
      card.style.setProperty("--mouse-x", "-500px")
      card.style.setProperty("--mouse-y", "-500px")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setEmail("")
      setSubmitted(false)
    }, 3000)
  }

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 left-1/2 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-float" />
        <div
          className="absolute -bottom-1/3 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <Card
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`p-8 sm:p-12 bg-background border border-accent/30 relative overflow-hidden transition-all duration-700 group ${isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background:
                "radial-gradient(800px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), rgba(251, 146, 60, 0.2), transparent 80%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-mesh-gradient" />

          <div className="text-center relative z-10">
            <h2
              className={`text-4xl sm:text-5xl font-bold text-foreground mb-4 text-balance transition-all duration-700 delay-100 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              Ready to Build Secure AI?
            </h2>
            <p
              className={`text-lg text-foreground/60 mb-8 max-w-2xl mx-auto transition-all duration-700 delay-200 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              Join leading enterprises building the future of internal AI. Start with a free sandbox, no credit card
              required.
            </p>

            {!submitted ? (
              <form
                onSubmit={handleSubmit}
                className={`flex flex-col sm:flex-row gap-3 max-w-md mx-auto transition-all duration-700 delay-300 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <div className="flex-1 relative group/input">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within/input:text-accent transition-colors" />
                  <input
                    type="email"
                    placeholder="your@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-accent/30 bg-background text-foreground placeholder-foreground/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/40 focus:shadow-lg focus:shadow-accent/30 transition-all duration-300"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-2xl hover:shadow-primary/60 gap-2 whitespace-nowrap transition-all duration-300 hover:scale-105 group/btn border-0"
                >
                  Get Early Access
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </form>
            ) : (
              <div
                className={`bg-primary/20 border border-primary/40 rounded-lg p-6 text-center transition-all duration-500 ${submitted ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-accent animate-bounce" />
                  <p className="text-accent font-semibold">Thanks for your interest!</p>
                </div>
                <p className="text-foreground/60 text-sm">Check your email soon.</p>
              </div>
            )}

            <p
              className={`text-foreground/50 text-sm mt-6 transition-all duration-700 delay-400 ${isLoaded ? "opacity-100" : "opacity-0"}`}
            >
              No spam, just early access to Nectic. Unsubscribe anytime.
            </p>
          </div>
        </Card>
      </div>
    </section>
  )
}
