"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

const steps = [
  {
    number: "01",
    title: "Ingest",
    description:
      "Upload your WhatsApp group exports — .txt or .zip, any length. Nectic parses the full conversation in seconds. Direct BSP sync via WATI for teams that want zero-touch ingestion.",
    detail:
      "Works with any WhatsApp group: customer onboarding, renewal, support. Bahasa Indonesia and English both handled natively.",
  },
  {
    number: "02",
    title: "Monitor",
    description:
      "Nectic's agent runs every day. It re-scores every account, detects new churn signals, re-alerts on anything unactioned for 3+ days, and nudges stale accounts. No manual checking required.",
    detail:
      "Every signal links to the original customer quote. No black-box scores — you see exactly what the customer said and why it matters.",
  },
  {
    number: "03",
    title: "Decide",
    description:
      "The queue surfaces one pre-formed decision per account: a risk signal with a draft WhatsApp response already written. Your CS lead approves, edits, or dismisses. That's the only decision they make.",
    detail:
      "Accounts ranked by health score and ARR at risk. Critical accounts surface first with a draft action already waiting.",
  },
  {
    number: "04",
    title: "Close",
    description:
      "One click sends via WhatsApp Business. Signal resolved. Health score recalculated. ARR protected recorded. The loop closes — and the agent continues watching for what comes next.",
    detail:
      "Leadership sees weekly outcomes automatically: accounts saved, ARR protected, churn events prevented. No manual reporting. The system tracks its own impact.",
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
            One loop. Fully automated.<br />
            <span className="text-neutral-400">Your CS lead approves. The system closes it.</span>
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-100 rounded-xl overflow-hidden"
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
            "Full closed loop — detect → draft → send → health tracked",
            "Agent monitors accounts 24/7, no manual checking",
            "Send via WhatsApp Business in one click",
            "Health score 1–10 with trend history",
            "Competitor mentions detected automatically",
            "Bahasa Indonesia natively understood",
            "Pre-formed decisions — not raw data dumps",
            "Leadership digest every Monday — no manual report",
            "Re-alerts unactioned signals after 3 days",
            "ARR protected tracked per account",
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
