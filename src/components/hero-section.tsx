"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

function AccountHealthCard() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 1100),
      setTimeout(() => setStage(3), 1800),
      setTimeout(() => setStage(4), 2600),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease }}
      className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-[0_2px_24px_rgba(0,0,0,0.06)]"
    >
      {/* Header */}
      <div
        className={`px-5 py-4 border-b border-neutral-100 transition-all duration-500 ${stage >= 1 ? "opacity-100" : "opacity-0 translate-y-1"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">PT Mandiri Teknologi</p>
            <p className="text-xs text-neutral-400 mt-0.5">Last message: 3 days ago</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-md shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            HIGH
          </span>
        </div>
      </div>

      {/* Health score */}
      <div
        className={`px-5 py-4 border-b border-neutral-100 transition-all duration-500 ${stage >= 2 ? "opacity-100" : "opacity-0 translate-y-1"}`}
      >
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-3xl font-light text-neutral-900 tabular-nums">4</span>
          <span className="text-sm text-neutral-400">/10</span>
          <span className="ml-auto text-xs text-red-500 font-medium tabular-nums">-3 this week</span>
        </div>
        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-400 rounded-full transition-all duration-700"
            style={{ width: stage >= 2 ? "40%" : "0%" }}
          />
        </div>
      </div>

      {/* Competitor signal */}
      <div
        className={`bg-orange-50 border-b border-orange-100 px-5 py-4 transition-all duration-500 ${stage >= 3 ? "opacity-100" : "opacity-0 translate-y-1"}`}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-3 h-3 rounded-full bg-orange-400 shrink-0" />
          <span className="text-xs font-medium text-orange-700">Competitor mentioned</span>
          <span className="text-xs text-orange-700 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded ml-auto">
            Qontak
          </span>
        </div>
        <p className="text-sm text-neutral-800 leading-relaxed">
          &ldquo;Kita lagi coba Qontak juga bulan ini, nanti kita compare hasilnya...&rdquo;
        </p>
        <p className="text-xs text-neutral-400 mt-2">Renewal: March 2026</p>
      </div>

      {/* Co-pilot action */}
      <div
        className={`px-5 py-3.5 transition-all duration-500 ${stage >= 4 ? "opacity-100" : "opacity-0 translate-y-1"}`}
      >
        <button className="w-full flex items-center gap-2.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
          <span className="w-5 h-5 rounded bg-neutral-100 flex items-center justify-center text-neutral-400 shrink-0 text-[10px]">
            AI
          </span>
          Draft retention response with co-pilot
          <span className="ml-auto text-neutral-300">→</span>
        </button>
      </div>
    </motion.div>
  )
}

export default function HeroSection() {
  return (
    <section className="min-h-[calc(100vh-64px)] flex items-center px-6 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto w-full pt-20 pb-12 lg:pb-16">
        <div className="grid xl:grid-cols-[1fr_360px] gap-10 xl:gap-16 items-center">
          {/* Left — copy */}
          <motion.div variants={container} initial="hidden" animate="visible">
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 uppercase tracking-widest"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Account Health OS for WhatsApp-first B2B SaaS
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="mt-6 text-4xl sm:text-5xl lg:text-[3.25rem] font-light text-neutral-900 leading-[1.1] tracking-tight"
            >
              You find out a customer<br />
              <span className="text-neutral-400">is leaving after they stop replying.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-7 text-lg text-neutral-500 max-w-md leading-relaxed"
            >
              Nectic connects to WhatsApp Business, reads your customer conversations,
              and surfaces churn signals 2 to 4 weeks before the account goes quiet.
            </motion.p>

            <motion.p
              variants={fadeUp}
              className="mt-3 text-base text-neutral-400 max-w-md leading-relaxed"
            >
              Health scores, competitor alerts, and a Monday briefing.
              Built for CS leads and PMs in Indonesia and Singapore.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-9 flex flex-col sm:flex-row gap-3"
            >
              <Link
                href="#early-access"
                className="inline-flex items-center justify-center bg-neutral-900 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                Request early access
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center text-sm text-neutral-500 px-6 py-3 rounded-lg hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 transition-colors"
              >
                See how it works
              </a>
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="mt-5 text-xs text-neutral-400"
            >
              Requires WhatsApp Business API via WATI. No CRM needed.
            </motion.p>
          </motion.div>

          {/* Right — product card */}
          <div className="hidden xl:block">
            <AccountHealthCard />
          </div>
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4, ease }}
          className="mt-14 pt-10 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-8"
        >
          {[
            { stat: "91%", label: "of B2B communication in Indonesia happens on WhatsApp" },
            { stat: "62-70%", label: "net revenue retention in SEA vs 90% globally" },
            { stat: "40%", label: "save rate when churn signals are caught 3 weeks early" },
          ].map((item) => (
            <div key={item.stat}>
              <p className="text-3xl font-light text-neutral-900 tabular-nums">{item.stat}</p>
              <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
