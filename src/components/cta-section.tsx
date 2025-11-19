"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Mail, Check, Calendar, Sparkles } from "lucide-react"

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
    <section id="contact" className="py-32 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 left-1/2 w-[800px] h-[800px] bg-accent/15 rounded-full blur-3xl animate-float" />
        <div
          className="absolute -bottom-1/3 right-1/4 w-[700px] h-[700px] bg-primary/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Card
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`relative p-12 sm:p-16 bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20 overflow-hidden transition-all duration-700 group ${
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* Hover gradient effect */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background:
                "radial-gradient(1000px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), rgba(251, 146, 60, 0.2), transparent 80%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-mesh-gradient" />

          <div className="text-center relative z-10">
            {/* Icon */}
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 transition-all duration-700 delay-100 ${
                isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-0"
              }`}
            >
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>

            <h2
              className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 text-balance transition-all duration-700 delay-200 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              Ready to Build
              <span className="block mt-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
                Secure AI?
              </span>
            </h2>
            <p
              className={`text-xl text-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-300 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              Join leading enterprises building the future of internal AI. Start with a free sandbox, no credit
              card required.
            </p>

            {!submitted ? (
              <form
                onSubmit={handleSubmit}
                className={`flex flex-col sm:flex-row gap-4 max-w-lg mx-auto transition-all duration-700 delay-400 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <div className="flex-1 relative group/input">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within/input:text-primary transition-colors z-10" />
                  <input
                    type="email"
                    placeholder="your@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-primary/20 bg-background/50 backdrop-blur-sm text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 focus:shadow-xl focus:shadow-primary/20 transition-all duration-300 text-base"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="group/btn bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground hover:shadow-2xl hover:shadow-primary/50 gap-3 px-8 py-4 text-base font-semibold border-0 transition-all duration-300 hover:scale-105 overflow-hidden whitespace-nowrap"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Early Access
                    <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 animate-shimmer bg-[length:200%_auto]" />
                </Button>
              </form>
            ) : (
              <div
                className={`bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/40 rounded-2xl p-8 text-center transition-all duration-500 max-w-md mx-auto ${
                  submitted ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <p className="text-primary font-bold text-lg">Thanks for your interest!</p>
                </div>
                <p className="text-foreground/70">Check your email soon for early access details.</p>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-foreground/50 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Schedule a demo instead</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/50 text-sm">
                <Check className="w-4 h-4 text-primary" />
                <span>No spam, unsubscribe anytime</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
