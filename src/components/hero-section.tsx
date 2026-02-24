"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <section
      className="relative pt-40 pb-32 px-6 lg:px-8 bg-background overflow-hidden min-h-screen flex items-center"
      onMouseMove={handleMouseMove}
    >
      {/* Animated gradient background that responds to mouse */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none"
        style={{
          opacity: mousePosition.x > 0 || mousePosition.y > 0 ? 0.15 : 0,
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            hsl(40, 100%, 65%, 0.3) 0%, 
            hsl(45, 100%, 70%, 0.15) 30%, 
            transparent 70%)`,
        }}
      />

      {/* Subtle mesh gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      {/* Animated gradient orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 transition-all duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(circle, hsl(40, 100%, 65%, 0.4), transparent 70%)`,
          transform: `translate(${(mousePosition.x - 25) * 0.1}px, ${(mousePosition.y - 25) * 0.1}px)`,
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 transition-all duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(circle, hsl(45, 100%, 70%, 0.4), transparent 70%)`,
          transform: `translate(${(mousePosition.x - 75) * -0.1}px, ${(mousePosition.y - 75) * -0.1}px)`,
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        <div
          className={`inline-block mb-6 text-sm text-foreground/50 transition-all duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          Indonesia-first · 30-second answers
        </div>

        {/* Main Headline - Large, Clean, Minimal */}
        <h1
          className={`text-6xl sm:text-7xl lg:text-8xl font-light text-foreground mb-8 leading-[1.1] tracking-tight transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Turn your spreadsheets
          <br />
          <span className="text-foreground/95">into a CFO you can chat with</span>
        </h1>

        {/* Subheadline - Simple, Direct */}
        <p
          className={`text-xl text-foreground/60 mb-12 max-w-2xl leading-relaxed transition-all duration-700 ease-out delay-75 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Finance teams spend 5+ hours/week on reports. Ask &quot;What&apos;s our burn rate?&quot;—get the answer in 30 seconds. No SQL, no dashboards.
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-wrap gap-4 transition-all duration-700 ease-out delay-150 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <Button
            size="lg"
            asChild
            className="group bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-base font-medium transition-all duration-200 hover:shadow-lg hover:shadow-foreground/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link href="/demo">
              Try now
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-12 px-8 text-base font-medium"
          >
            <Link href="/auth/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
