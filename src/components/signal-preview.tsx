"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

function RiskBadge({ level }: { level: "critical" | "high" | "medium" | "low" }) {
  const styles = {
    critical: "bg-red-50 text-red-700 border-red-200",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }
  return (
    <span className={`text-xs font-medium border px-2 py-0.5 rounded-md ${styles[level]}`}>
      {level.toUpperCase()}
    </span>
  )
}

function HealthBar({ score }: { score: number }) {
  const color =
    score <= 3
      ? "bg-red-400"
      : score <= 5
      ? "bg-orange-400"
      : score <= 7
      ? "bg-amber-400"
      : "bg-emerald-400"
  return (
    <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score * 10}%` }} />
    </div>
  )
}

// Feature 1: Account health scoring mockup
function HealthScoreMockup() {
  const accounts = [
    { name: "PT Mandiri Teknologi", score: 4, risk: "high" as const, delta: "-3" },
    { name: "TechFlow Indonesia", score: 5, risk: "high" as const, delta: "-2" },
    { name: "SaaSGo ID", score: 8, risk: "low" as const, delta: "+4" },
    { name: "Koneksi Digital", score: 6, risk: "medium" as const, delta: "-1" },
  ]

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500">All accounts</span>
        <span className="text-xs text-neutral-400">Sorted by risk</span>
      </div>
      <div className="divide-y divide-neutral-50">
        {accounts.map((a) => (
          <div key={a.name} className="px-4 py-3.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-neutral-900 truncate pr-2">{a.name}</p>
              <RiskBadge level={a.risk} />
            </div>
            <div className="flex items-center gap-3">
              <HealthBar score={a.score} />
              <span className="text-xs font-medium text-neutral-500 tabular-nums shrink-0">
                {a.score}/10
              </span>
              <span
                className={`text-xs font-medium tabular-nums shrink-0 ${
                  a.delta.startsWith("+") ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {a.delta}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Feature 2: Competitor alert mockup
function CompetitorAlertMockup() {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">PT Mandiri Teknologi</p>
            <p className="text-xs text-neutral-400 mt-0.5">Health 4/10 · Renewal March 2026</p>
          </div>
          <RiskBadge level="high" />
        </div>
      </div>

      {/* Competitor alert */}
      <div className="bg-orange-50 border-b border-orange-100 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
          <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
            Competitor mentioned
          </span>
          <span className="ml-auto text-xs bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded">
            Qontak
          </span>
        </div>
        <p className="text-sm text-neutral-800 leading-relaxed italic mb-1">
          &ldquo;Kita lagi coba Qontak juga bulan ini, nanti kita compare hasilnya...&rdquo;
        </p>
        <p className="text-xs text-neutral-500">Feb 18, 2026</p>
      </div>

      {/* Co-pilot pre-fill */}
      <div className="px-5 py-3.5 bg-neutral-900">
        <p className="text-xs text-neutral-400 mb-2">Nectic co-pilot</p>
        <p className="text-sm text-white leading-relaxed">
          Draft a retention message for PT Mandiri Teknologi. They mentioned Qontak.
          Renewal is in 5 weeks. Emphasise what we do better for their use case.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-neutral-400">Drafting response...</span>
        </div>
      </div>
    </div>
  )
}

// Feature 3: Action queue mockup
function ActionQueueMockup() {
  const signals = [
    {
      account: "PT Mandiri Teknologi",
      risk: "high" as const,
      title: "Evaluating competitor Qontak",
      type: "competitor",
      status: "open",
    },
    {
      account: "TechFlow Indonesia",
      risk: "high" as const,
      title: "Support response time complaints",
      type: "risk",
      status: "in_progress",
    },
    {
      account: "Koneksi Digital",
      risk: "medium" as const,
      title: "API integration confusion",
      type: "risk",
      status: "open",
    },
  ]

  const statusStyle = {
    open: "text-neutral-400 border-neutral-200",
    in_progress: "text-blue-600 bg-blue-50 border-blue-200",
    done: "text-emerald-600 bg-emerald-50 border-emerald-200",
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-3">
        <span className="text-xs font-medium text-neutral-500">Action queue</span>
        <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-md ml-auto">
          3 open
        </span>
      </div>
      <div className="divide-y divide-neutral-50">
        {signals.map((s, i) => (
          <div key={i} className="px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  s.type === "competitor" ? "bg-orange-400" : "bg-red-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-400 mb-0.5">{s.account}</p>
                <p className="text-sm text-neutral-700 leading-snug">{s.title}</p>
              </div>
              <span
                className={`text-xs border px-2 py-0.5 rounded-md shrink-0 ${
                  statusStyle[s.status as keyof typeof statusStyle]
                }`}
              >
                {s.status.replace("_", " ")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface FeatureRow {
  label: string
  title: string
  description: string
  detail: string
  mockup: React.ReactNode
  reversed?: boolean
}

function FeatureSection({ feature }: { feature: FeatureRow }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <div
      ref={ref}
      className={`grid md:grid-cols-2 gap-10 lg:gap-16 items-center ${
        feature.reversed ? "md:[&>*:first-child]:order-2" : ""
      }`}
    >
      <motion.div
        initial={{ opacity: 0, x: feature.reversed ? 24 : -24 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, ease }}
      >
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
          {feature.label}
        </p>
        <h3 className="text-2xl font-light text-neutral-900 leading-snug mb-4">{feature.title}</h3>
        <p className="text-base text-neutral-500 leading-relaxed mb-4">{feature.description}</p>
        <p className="text-sm text-neutral-400 leading-relaxed">{feature.detail}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: feature.reversed ? -24 : 24 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.1, ease }}
      >
        {feature.mockup}
      </motion.div>
    </div>
  )
}

const features: FeatureRow[] = [
  {
    label: "Account health",
    title: "Every account has a score. Not a gut feel.",
    description:
      "Nectic reads each conversation and assigns a health score from 1 to 10. Accounts are ranked from most at-risk downward. You see the trend, the delta, and the reason.",
    detail:
      "Health scores update on every re-analysis. The dashboard shows accounts that declined this week so your team knows where to focus.",
    mockup: <HealthScoreMockup />,
  },
  {
    label: "Competitor detection",
    title: "Catch the message your CS rep missed.",
    description:
      "When a customer mentions a competitor in Bahasa Indonesia, English, or code-switched between both, Nectic flags it immediately. An alert lands with the exact quote and the renewal date.",
    detail:
      "One click pre-fills the co-pilot with everything it needs to draft a retention response. Account context, competitor name, renewal window, all injected.",
    mockup: <CompetitorAlertMockup />,
    reversed: true,
  },
  {
    label: "Action queue",
    title: "Signals ranked by risk. Nothing buried.",
    description:
      "All open signals from all accounts in one queue, grouped by account and sorted by the worst risk first. CS leads and PMs work from the same list.",
    detail:
      "Mark signals in progress, done, or dismissed. The co-pilot knows what you have already actioned and will not repeat the same suggestion.",
    mockup: <ActionQueueMockup />,
  },
]

export default function SignalPreview() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" })

  return (
    <section className="py-20 sm:py-28 px-6 lg:px-8 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 16 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="mb-16"
        >
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
            What your team gets
          </p>
          <h2 className="text-3xl font-light text-neutral-900 max-w-xl leading-tight">
            Built around the three things that actually reduce churn.
          </h2>
        </motion.div>

        <div className="space-y-20 sm:space-y-28">
          {features.map((f) => (
            <FeatureSection key={f.label} feature={f} />
          ))}
        </div>
      </div>
    </section>
  )
}
