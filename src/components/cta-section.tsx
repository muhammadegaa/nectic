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
          className={`text-5xl sm:text-6xl font-light text-foreground mb-8 leading-tight transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Ready to get started?
        </h2>
        <div
          className={`transition-all duration-700 ease-out delay-150 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <Button
            size="lg"
            className="group bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-base font-medium transition-all duration-200 hover:shadow-lg hover:shadow-foreground/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            Talk to us
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  )
}
