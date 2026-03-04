"use client"

import { useEffect, useState } from "react"

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="min-h-screen flex items-center px-6 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto w-full pt-24 pb-16">

        <div
          className={`transition-all duration-500 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">
            Product intelligence
          </span>
        </div>

        <h1
          className={`mt-6 text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight transition-all duration-700 delay-100 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          Your roadmap shouldn't depend on
          <br />
          <span className="text-neutral-400">what sales decides to tell you.</span>
        </h1>

        <p
          className={`mt-8 text-lg text-neutral-500 max-w-xl leading-relaxed transition-all duration-700 delay-150 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          Nectic connects to wherever your deals actually happen — WhatsApp, Zoom calls, CRM notes —
          and delivers a weekly product intelligence brief to your PM. What customers said, not what
          sales decided to pass on.
        </p>

        <div
          className={`mt-10 flex flex-col sm:flex-row gap-3 transition-all duration-700 delay-200 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <a
            href="#early-access"
            className="inline-flex items-center justify-center bg-neutral-900 text-white text-sm font-medium px-6 py-3 hover:bg-neutral-700 transition-colors"
          >
            Request early access
          </a>
          <a
            href="/demo"
            className="inline-flex items-center justify-center text-sm text-neutral-500 px-6 py-3 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 transition-colors"
          >
            See live demo →
          </a>
        </div>

        <p
          className={`mt-6 text-xs text-neutral-400 transition-all duration-700 delay-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          WhatsApp · Zoom · HubSpot · Salesforce → PM brief → Jira ticket → shipped feature.
        </p>
      </div>
    </section>
  )
}
