"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

const before = [
  "CS manager spends 2–3 hrs manually reading WhatsApp to see where accounts stand",
  "Churn signal fires on Friday evening — nobody sees it until Tuesday",
  "PM discovers an account at risk 3 weeks late, when CS finally escalates it",
  "Weekly account health review takes 30 mins of copying notes across tools",
]

const after = [
  "Agent scans every account overnight — queue shows only what needs a decision today",
  "Unactioned critical signal after 3 days? Agent re-alerts automatically",
  "Risk detected the day the signal appears — draft response already waiting",
  "Monday briefing delivered automatically. ARR saved, accounts protected, no manual report",
]

export default function GapSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="py-20 sm:py-28 px-6 lg:px-8 bg-neutral-50" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease }}
          className="mb-10"
        >
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
            Before &amp; after
          </p>
          <h2 className="text-3xl font-light text-neutral-900 max-w-lg leading-tight">
            The agent runs the operational work.<br />
            <span className="text-neutral-400">Your team focuses on saving the account.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-px bg-neutral-200 rounded-xl overflow-hidden">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.1, ease }}
            className="bg-white px-6 py-7"
          >
            <p className="text-xs font-medium uppercase tracking-widest mb-5 text-neutral-400">
              Without Nectic
            </p>
            <ul className="space-y-4">
              {before.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08, ease }}
                  className="flex items-start gap-3"
                >
                  <span className="w-4 h-4 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  </span>
                  <p className="text-sm text-neutral-600 leading-relaxed">{item}</p>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.2, ease }}
            className="bg-neutral-900 px-6 py-7"
          >
            <p className="text-xs font-medium uppercase tracking-widest mb-5 text-neutral-500">
              With Nectic
            </p>
            <ul className="space-y-4">
              {after.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.08, ease }}
                  className="flex items-start gap-3"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-900 border border-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </span>
                  <p className="text-sm text-neutral-300 leading-relaxed">{item}</p>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-7 text-sm text-neutral-400 max-w-xl"
        >
          If Nectic disappears tomorrow, your CS team reverts to manual WhatsApp triage. Accounts slip. Revenue at risk goes unnoticed. Churn happens two weeks later. That&apos;s the test of whether something is mission-critical.
        </motion.p>
      </div>
    </section>
  )
}
