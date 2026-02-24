"use client"

import { useEffect, useState } from "react"

const items = [
  {
    title: "Your data stays yours",
    description: "We never store your sensitive information. Data stays in your infrastructure.",
  },
  {
    title: "No training on your data",
    description: "API calls use privacy controls. Your data is not used for model training.",
  },
  {
    title: "User isolation",
    description: "Each user only sees their own data. No cross-contamination.",
  },
]

export default function EnterpriseTrust() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section id="security" className="py-24 px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div
          className={`transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-2xl font-light text-foreground mb-8">Security</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ease-out ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="text-lg font-medium text-foreground mb-1">{item.title}</div>
                <div className="text-sm text-foreground/50 leading-relaxed">{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
