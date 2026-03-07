"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

const steps = [
  {
    number: "01",
    title: "Connect",
    description:
      "Connect your WhatsApp Business account. Nectic reads your existing customer conversations in under 60 seconds. No new tools for your CS team, no IT ticket.",
    detail:
      "Works with any 1:1 WhatsApp Business conversation. Customer onboarding, renewal, support — all of it.",
  },
  {
    number: "02",
    title: "Detect",
    description:
      "AI reads each conversation and extracts churn signals with the exact customer quote. Competitor mentions, sentiment drops, renewal hesitation. Works in Bahasa Indonesia and English.",
    detail:
      "Every signal links to the original message. No black-box scores. You see exactly what the customer said and why it matters.",
  },
  {
    number: "03",
    title: "Act",
    description:
      "Accounts ranked by health score. Competitor alerts with a co-pilot to draft your retention response. A weekly briefing lands every Monday before standup.",
    detail:
      "Signal detected, response drafted, sent. The full loop in under 2 minutes.",
  },
]

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

export default function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="how-it-works" className="py-20 sm:py-28 px-6 lg:px-8 bg-white" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease }}
          className="mb-14"
        >
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
            How it works
          </p>
          <h2 className="text-3xl font-light text-neutral-900 leading-tight max-w-lg">
            From WhatsApp conversation<br />
            <span className="text-neutral-400">to action queue in minutes.</span>
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-px bg-neutral-100 rounded-xl overflow-hidden"
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={item}
              className="bg-white px-7 py-8 flex flex-col"
            >
              <span className="text-xs font-mono text-neutral-300 mb-5">{step.number}</span>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">{step.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed mb-5">{step.description}</p>
              <p className="text-xs text-neutral-400 leading-relaxed mt-auto pt-5 border-t border-neutral-100">
                {step.detail}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 flex flex-wrap gap-2"
        >
          {[
            "Health score 1-10",
            "Competitor mention detection",
            "Bahasa Indonesia support",
            "Risk-ranked action queue",
            "Co-pilot response drafting",
            "Weekly digest email",
          ].map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 border border-neutral-200 bg-white px-3 py-1.5 rounded-full"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <polyline
                  points="2 8 6 12 14 4"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-500"
                  style={{ stroke: "#10b981" }}
                />
              </svg>
              {chip}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
