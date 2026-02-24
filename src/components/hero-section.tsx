"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="relative pt-40 pb-32 px-6 lg:px-8 bg-background overflow-hidden min-h-screen flex items-center">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div
          className={`inline-block mb-6 text-sm text-foreground/50 transition-all duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          From 5-hour reports to 30-second answers
        </div>

        <h1
          className={`text-5xl sm:text-6xl lg:text-7xl font-light text-foreground mb-6 leading-[1.1] tracking-tight transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Stop drowning in spreadsheets.
          <br />
          <span className="text-foreground/95">Start leading with insights.</span>
        </h1>

        <p
          className={`text-lg sm:text-xl text-foreground/60 mb-10 max-w-xl leading-relaxed transition-all duration-700 ease-out delay-75 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Ask any financial question. Get instant answers from your data. No SQL, no dashboards.
        </p>

        <div
          className={`transition-all duration-700 ease-out delay-150 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Button
            size="lg"
            asChild
            className="group bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-base font-medium transition-all duration-200 hover:shadow-lg hover:shadow-foreground/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link href="/demo">
              Get your financial time back
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
