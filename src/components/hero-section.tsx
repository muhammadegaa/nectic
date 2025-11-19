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
    <section className="relative pt-40 pb-32 px-6 lg:px-8 bg-background overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.02] via-transparent to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Funding Badge */}
        <div
          className={`inline-block mb-8 text-sm text-foreground/50 transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          Trusted by Fortune 500 enterprises
        </div>

        {/* Main Headline - Large, Clean, Minimal */}
        <h1
          className={`text-6xl sm:text-7xl lg:text-8xl font-light text-foreground mb-8 leading-[1.1] tracking-tight transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Internal AI
          <br />
          <span className="text-foreground/95">that never leaks</span>
        </h1>

        {/* Subheadline - Simple, Direct */}
        <p
          className={`text-xl text-foreground/60 mb-12 max-w-2xl leading-relaxed transition-all duration-700 ease-out delay-75 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Build secure AI assistants that connect directly to your private databases.
          Zero data leakage, complete control.
        </p>

        {/* Single CTA - Clean with consistent hover */}
        <div
          className={`transition-all duration-700 ease-out delay-150 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <Button
            size="lg"
            className="group bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-base font-normal transition-all duration-200 hover:shadow-lg hover:shadow-foreground/20"
          >
            Talk to us
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  )
}
