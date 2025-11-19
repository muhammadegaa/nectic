"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
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
          className={`text-5xl sm:text-6xl font-light text-foreground mb-8 leading-tight transition-all duration-500 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Ready to get started?
        </h2>
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
