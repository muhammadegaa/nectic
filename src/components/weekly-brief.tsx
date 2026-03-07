"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

const urgentAccounts = [
  {
    name: "PT Mandiri Teknologi",
    score: 4,
    delta: -3,
    risk: "HIGH",
    quote: "Kita lagi coba Qontak juga bulan ini...",
    renewal: "March 2026",
    arr: "Rp 480M",
    riskColor: "text-orange-600",
    dotColor: "bg-orange-400",
  },
  {
    name: "TechFlow Indonesia",
    score: 5,
    delta: -2,
    risk: "HIGH",
    quote: "Response time makin lama, kami mulai khawatir...",
    renewal: "April 2026",
    arr: "Rp 240M",
    riskColor: "text-orange-600",
    dotColor: "bg-orange-400",
  },
]

const savedAccounts = [
  {
    name: "SaaSGo ID",
    score: 8,
    delta: 4,
    arr: "Rp 360M",
  },
]

function DigestRow({
  account,
  index,
  isInView,
}: {
  account: (typeof urgentAccounts)[0]
  index: number
  isInView: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.45, delay: 0.5 + index * 0.15, ease }}
      className="border-b border-neutral-100 last:border-0 px-5 py-4"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${account.dotColor}`} />
          <p className="text-sm font-medium text-neutral-900">{account.name}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-neutral-500 tabular-nums">
            {account.score}/10
          </span>
          <span className="text-xs font-medium text-red-500 tabular-nums">
            {account.delta}
          </span>
          <span className={`text-xs font-medium ${account.riskColor}`}>{account.risk}</span>
        </div>
      </div>
      <p className="text-xs text-neutral-500 italic ml-3.5 mb-1.5">&ldquo;{account.quote}&rdquo;</p>
      <div className="ml-3.5 flex items-center gap-3">
        <span className="text-xs text-neutral-400">Renewal: {account.renewal}</span>
        <span className="text-xs text-neutral-400">ARR {account.arr}</span>
      </div>
    </motion.div>
  )
}

export default function WeeklyBrief() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const [arrVisible, setArrVisible] = useState(false)

  useEffect(() => {
    if (isInView) {
      const t = setTimeout(() => setArrVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [isInView])

  return (
    <section className="py-20 sm:py-28 px-6 lg:px-8 bg-white" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease }}
            className="md:sticky md:top-24"
          >
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
              Monday briefing
            </p>
            <h2 className="text-3xl font-light text-neutral-900 leading-tight mb-5">
              Your team knows before the week starts.
            </h2>
            <p className="text-base text-neutral-500 leading-relaxed mb-4">
              Every Monday at 08:00, Nectic sends a briefing to your CS lead. Accounts that
              declined, competitor mentions that surfaced, and the accounts your team saved.
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed mb-8">
              No spreadsheet to fill in. No meeting to schedule. The context is already there
              before standup.
            </p>

            <div className="space-y-4">
              {[
                "Accounts ranked by the biggest health drop",
                "Exact customer quotes that triggered the alert",
                "ARR at risk and ARR protected this month",
                "Competitor mentions with renewal dates",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 shrink-0"
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <polyline
                      points="2 8 6 12 14 4"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-sm text-neutral-600">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — email mockup */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease }}
          >
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
              {/* Email header */}
              <div className="bg-neutral-900 px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono text-neutral-300">nectic / weekly-brief</span>
                  </div>
                  <p className="text-xs text-neutral-500">Mon Mar 9 · 08:00 WIB</p>
                </div>
                <span className="text-xs text-neutral-500 tabular-nums">34 conversations</span>
              </div>

              {/* Urgent section */}
              <div>
                <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                    Urgent
                  </span>
                  <span className="text-xs text-red-500 ml-auto">2 accounts need attention</span>
                </div>
                {urgentAccounts.map((a, i) => (
                  <DigestRow key={a.name} account={a} index={i} isInView={isInView} />
                ))}
              </div>

              {/* Saved section */}
              <div>
                <div className="px-5 py-3 bg-emerald-50 border-t border-b border-emerald-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                    Saved this month
                  </span>
                  <span className="text-xs text-emerald-600 ml-auto">1 account</span>
                </div>
                {savedAccounts.map((a, i) => (
                  <motion.div
                    key={a.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{
                      duration: 0.45,
                      delay: 0.5 + (urgentAccounts.length + i) * 0.15,
                      ease,
                    }}
                    className="px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <p className="text-sm font-medium text-neutral-900">{a.name}</p>
                      <span className="text-xs font-medium text-emerald-600 tabular-nums ml-auto">
                        +{a.delta}
                      </span>
                      <span className="text-xs font-medium text-neutral-500 tabular-nums">
                        {a.score}/10
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 ml-3.5 mt-1">
                      ARR protected {a.arr}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Footer totals */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={arrVisible ? { opacity: 1 } : {}}
                transition={{ duration: 0.4 }}
                className="px-5 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between"
              >
                <div className="text-center">
                  <p className="text-xs text-neutral-400 mb-0.5">ARR at risk</p>
                  <p className="text-sm font-medium text-red-600 tabular-nums">Rp 720M</p>
                </div>
                <div className="w-px h-6 bg-neutral-200" />
                <div className="text-center">
                  <p className="text-xs text-neutral-400 mb-0.5">ARR protected</p>
                  <p className="text-sm font-medium text-emerald-600 tabular-nums">Rp 360M</p>
                </div>
                <div className="w-px h-6 bg-neutral-200" />
                <div className="text-center">
                  <p className="text-xs text-neutral-400 mb-0.5">Accounts analyzed</p>
                  <p className="text-sm font-medium text-neutral-700 tabular-nums">34</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
