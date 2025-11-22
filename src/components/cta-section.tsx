"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

export default function CtaSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section id="contact" className="py-32 px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-5xl mx-auto text-center">
        <h2
          className={`text-5xl sm:text-6xl font-light text-foreground mb-4 leading-tight transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Ready to get started?
        </h2>
        <p
          className={`text-lg text-foreground/60 mb-8 max-w-2xl mx-auto transition-all duration-700 ease-out delay-75 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Join teams using Nectic to transform their data workflows. Start building secure AI assistants today.
        </p>
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 ease-out delay-150 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <Button
            size="lg"
            className="group bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-base font-medium transition-all duration-200 hover:shadow-lg hover:shadow-foreground/20 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => window.location.href = '/auth/signup'}
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-8 text-base font-medium"
            onClick={() => window.location.href = '#contact'}
          >
            Schedule a Demo
          </Button>
        </div>
      </div>
    </section>
  )
}
