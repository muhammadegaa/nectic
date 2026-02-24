"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"

const products = [
  {
    title: "Agent Builder",
    description: "Create AI agents that connect to your databases with no-code configuration.",
    link: "#",
  },
  {
    title: "Secure Chat",
    description: "Enterprise-grade chat interface with end-to-end encryption and audit trails.",
    link: "#",
  },
  {
    title: "Analytics Dashboard",
    description: "Monitor agent performance, usage metrics, and security events in real-time.",
    link: "#",
  },
]

export default function HowItWorks() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section id="how-it-works" className="py-32 px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Product Cards - Like Giga's "Explore Agent Canvas" */}
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <a
              key={index}
              href={product.link}
              className={`group block p-8 border border-border hover:border-foreground/20 transition-all duration-300 ease-out hover:bg-foreground/[0.01] ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-light text-foreground group-hover:text-foreground/90 transition-colors duration-200">
                  {product.title}
                </h3>
                <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-4" />
              </div>
              <p className="text-foreground/60 leading-relaxed group-hover:text-foreground/70 transition-colors duration-200">
                {product.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
