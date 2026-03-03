"use client"

import { useState } from "react"

export default function CtaSection() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <section id="early-access" className="py-24 px-6 lg:px-8 bg-neutral-900">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-6">
          Early access
        </p>

        <h2 className="text-3xl sm:text-4xl font-light text-white mb-4 max-w-lg leading-tight">
          First 10 teams get white-glove setup and 3 months free.
        </h2>

        <p className="text-neutral-400 text-base mb-10 max-w-md">
          We onboard you personally, connect your WhatsApp, and make sure your PM gets their first brief within 7 days.
        </p>

        {submitted ? (
          <div className="text-sm text-neutral-400 border border-neutral-700 px-6 py-4 max-w-sm">
            You're on the list. We'll reach out within 48 hours.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              type="email"
              required
              placeholder="your@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-neutral-800 border border-neutral-700 text-white text-sm px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
            />
            <button
              type="submit"
              className="bg-white text-neutral-900 text-sm font-medium px-6 py-3 hover:bg-neutral-200 transition-colors shrink-0"
            >
              Request access
            </button>
          </form>
        )}

        <p className="mt-6 text-xs text-neutral-600">
          B2B SaaS companies only. WhatsApp Business account required.
        </p>
      </div>
    </section>
  )
}
