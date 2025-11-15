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
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute -bottom-1/2 right-1/4 w-[600px] h-[600px] bg-primary/15 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 -left-1/3 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Badge with improved styling */}
        <div
          className={`inline-block mb-6 px-4 py-2 rounded-full border border-accent/50 bg-accent/10 text-foreground text-xs font-medium transition-all duration-700 hover:border-accent hover:bg-accent/20 hover:shadow-lg hover:shadow-accent/30 cursor-pointer ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <span className="inline-block w-2 h-2 bg-accent rounded-full mr-2 animate-pulse" />
          Secure AI for Enterprise
        </div>

        {/* Main Headline */}
        <h1
          className={`text-5xl sm:text-7xl font-bold text-foreground mb-6 text-balance transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <span className="inline-block">Your AI,</span>
          <br />
          <span className="relative inline-block bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
            Your Control
            <span
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-transparent rounded-full animate-line-reveal"
              style={{ animationDelay: "0.5s" }}
            />
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className={`text-lg sm:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto text-balance leading-relaxed transition-all duration-700 delay-100 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          Build enterprise-grade AI assistants that connect securely to your private databases. No shared models, no
          data leakage, complete privacy.
        </p>

        {/* CTA Buttons with enhanced hover effects */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 delay-200 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-2xl hover:shadow-primary/60 gap-2 group transition-all duration-300 border-0 hover:scale-105"
          >
            Try Sandbox
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 bg-transparent border border-accent/40 hover:border-accent text-foreground transition-all duration-300 hover:bg-accent/10 hover:shadow-lg hover:shadow-accent/30 hover:scale-105"
          >
            Get Early Access
          </Button>
        </div>

        {/* Tech stack indicator */}
        <div
          className={`mt-16 flex justify-center items-center gap-2 text-foreground/50 text-sm transition-all duration-700 delay-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          Works with OpenAI, Claude, Llama, and more
        </div>
      </div>
    </section>
  )
}
