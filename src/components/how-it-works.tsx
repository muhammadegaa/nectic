"use client"

import { useEffect, useState } from "react"

const steps = [
  {
    title: "Connect your data",
    description: "Upload Excel or CSV. No setup, no connectors.",
  },
  {
    title: "Ask a question",
    description: "What's our burn rate? Top 5 expenses? Get the answer in 30 seconds.",
  },
  {
    title: "Done",
    description: "No SQL. No dashboards. No IT ticket.",
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
          {steps.map((step, index) => (
            <div
              key={index}
              className={`p-8 border border-border ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <span className="text-sm font-medium text-foreground/50">Step {index + 1}</span>
              <h3 className="text-xl font-medium text-foreground mt-2">{step.title}</h3>
              <p className="text-foreground/60 mt-2 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
