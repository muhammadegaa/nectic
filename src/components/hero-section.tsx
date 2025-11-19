"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="relative pt-32 pb-24 px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-md border border-border bg-muted/50 text-xs font-medium text-foreground/70 transition-all duration-500 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Enterprise-Grade Security
        </div>

        {/* Main Headline */}
        <h1
          className={`text-5xl sm:text-6xl lg:text-7xl font-semibold text-foreground mb-6 leading-tight tracking-tight transition-all duration-500 delay-75 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Internal AI that
          <br />
          <span className="text-foreground/90">never leaks data</span>
        </h1>

        {/* Subheadline */}
        <p
          className={`text-lg sm:text-xl text-foreground/60 mb-10 max-w-2xl leading-relaxed transition-all duration-500 delay-150 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Build secure AI assistants that connect directly to your private databases.
          Zero data leakage, complete control, enterprise-ready.
        </p>

        {/* CTA Buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 mb-16 transition-all duration-500 delay-200 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Button
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90 h-12 px-6 text-base font-medium"
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-6 text-base font-medium border-border hover:bg-muted"
          >
            Schedule Demo
          </Button>
        </div>

        {/* Trust Indicators */}
        <div
          className={`flex flex-wrap items-center gap-8 text-sm text-foreground/50 transition-all duration-500 delay-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
            <span>Private Deployment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
            <span>SOC2 Type II</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
            <span>Works with OpenAI, Claude, Llama</span>
          </div>
        </div>
      </div>
    </section>
  )
}
