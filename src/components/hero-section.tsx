"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const fade = (delay: string) =>
    `transition-all duration-700 ${delay} ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`

  return (
    <section className="min-h-screen flex items-center px-6 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto w-full pt-24 pb-16">

        <div className={fade("delay-0")}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI-native churn prevention · WhatsApp-first B2B SaaS
          </span>
        </div>

        <h1 className={`mt-6 text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight ${fade("delay-100")}`}>
          You find out a customer<br />
          <span className="text-neutral-400">is leaving after they stop replying.</span>
        </h1>

        <p className={`mt-8 text-lg text-neutral-500 max-w-xl leading-relaxed ${fade("delay-150")}`}>
          Nectic detects churn signals 2–4 weeks early in WhatsApp conversations —
          built for B2B SaaS teams in Southeast Asia where 91% of deals happen on WhatsApp.
        </p>

        <div className={`mt-10 flex flex-col sm:flex-row gap-3 ${fade("delay-200")}`}>
          <Link
            href="/concept/login"
            className="inline-flex items-center justify-center bg-neutral-900 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Start for free →
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center text-sm text-neutral-500 px-6 py-3 rounded-lg hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 transition-colors"
          >
            See how it works
          </a>
        </div>

        <p className={`mt-6 text-xs text-neutral-400 ${fade("delay-300")}`}>
          Upload a WhatsApp export or connect WATI — first analysis in under 60 seconds.
        </p>

        {/* Stats strip */}
        <div className={`mt-16 pt-10 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-8 ${fade("delay-[400ms]")}`}>
          {[
            { stat: "91%", label: "of B2B communication in Indonesia is WhatsApp" },
            { stat: "62–70%", label: "net revenue retention in SEA vs 90% global benchmark" },
            { stat: "40%", label: "save rate when churn signals are caught early" },
          ].map((item) => (
            <div key={item.stat}>
              <p className="text-3xl font-light text-neutral-900 tabular-nums">{item.stat}</p>
              <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
