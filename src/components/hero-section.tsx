"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="relative pt-40 pb-32 px-6 lg:px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Funding Badge - Like Giga's "$61M Series A" */}
        <div
          className={`inline-block mb-8 text-sm text-foreground/50 transition-all duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          Trusted by Fortune 500 enterprises
        </div>

        {/* Main Headline - Large, Clean, Minimal */}
        <h1
          className={`text-6xl sm:text-7xl lg:text-8xl font-light text-foreground mb-8 leading-[1.1] tracking-tight transition-all duration-500 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Internal AI
          <br />
          that never leaks
        </h1>

        {/* Subheadline - Simple, Direct */}
        <p
          className={`text-xl text-foreground/60 mb-12 max-w-2xl leading-relaxed transition-all duration-500 delay-100 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Build secure AI assistants that connect directly to your private databases.
          Zero data leakage, complete control.
        </p>

        {/* Single CTA - Clean */}
        <div
          className={`transition-all duration-500 delay-200 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Button
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-base font-normal"
          >
            Talk to us
          </Button>
        </div>
      </div>
    </section>
  )
}

