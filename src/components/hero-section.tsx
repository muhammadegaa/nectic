"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, Database } from "lucide-react"
import { useEffect, useState } from "react"

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute -bottom-1/3 right-1/4 w-[900px] h-[900px] bg-accent/15 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute top-1/2 -left-1/4 w-[700px] h-[700px] bg-secondary/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        />
        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 animate-mesh-gradient" />
      </div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        {/* Enterprise Badge */}
        <div
          className={`inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 backdrop-blur-sm text-foreground text-sm font-semibold transition-all duration-700 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Shield className="w-4 h-4 text-primary" />
          <span>Enterprise-Grade Security</span>
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>

        {/* Main Headline */}
        <h1
          className={`text-6xl sm:text-7xl lg:text-8xl font-extrabold text-foreground mb-8 text-balance leading-tight transition-all duration-700 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="block mb-2">Internal AI</span>
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
              That Never Leaks
            </span>
            <span className="absolute bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-xl animate-pulse" />
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className={`text-xl sm:text-2xl text-foreground/80 mb-12 max-w-3xl mx-auto text-balance leading-relaxed font-light transition-all duration-700 delay-100 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Build secure AI assistants that connect directly to your private databases.
          <span className="block mt-2 text-lg text-foreground/60">
            Zero data leakage. Complete control. Enterprise-ready.
          </span>
        </p>

        {/* CTA Buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 transition-all duration-700 delay-200 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Button
            size="lg"
            className="group relative bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground hover:shadow-2xl hover:shadow-primary/50 gap-3 px-8 py-6 text-base font-semibold border-0 transition-all duration-300 hover:scale-105 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Try Sandbox
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer bg-[length:200%_auto]" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="group gap-3 px-8 py-6 text-base font-semibold bg-background/50 backdrop-blur-sm border-2 border-primary/30 hover:border-primary/60 text-foreground transition-all duration-300 hover:bg-primary/10 hover:shadow-xl hover:shadow-primary/20 hover:scale-105"
          >
            Schedule Demo
            <Zap className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          </Button>
        </div>

        {/* Trust Indicators */}
        <div
          className={`flex flex-wrap justify-center items-center gap-8 sm:gap-12 text-foreground/50 text-sm transition-all duration-700 delay-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <span>Private Deployment</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>SOC2 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span>Works with OpenAI, Claude, Llama</span>
          </div>
        </div>

        {/* Stats Section */}
        <div
          className={`mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-700 delay-400 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {[
            { value: "99.9%", label: "Uptime SLA" },
            { value: "0ms", label: "Data Leakage" },
            { value: "256-bit", label: "Encryption" },
            { value: "24/7", label: "Support" },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-background via-background to-primary/5 border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group"
            >
              <div className="text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                {stat.value}
              </div>
              <div className="text-sm text-foreground/60 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
