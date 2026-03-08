"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = "critical" | "high" | "medium" | "low"

interface DemoSignal {
  title: string
  explanation: string
  quote: string
  type: "risk" | "product" | "relationship"
  draft?: string
}

interface DemoAccount {
  id: string
  name: string
  plan: string
  arr: number
  arrAtRisk: number
  health: number
  healthTrend: "falling" | "stable" | "rising"
  riskLevel: RiskLevel
  renewal: string
  signals: DemoSignal[]
  lastContact: string
  savedArr?: number
  savedAt?: string
}

// ─── Hardcoded data ───────────────────────────────────────────────────────────

const AGENT_RUN = {
  runAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  accountsScanned: 8,
  alertsSent: 2,
  readyCount: 2,
  events: [
    { type: "alert", accountName: "PT Mandiri Teknologi", detail: "Competitor mentioned · health dropped to 3/10" },
    { type: "alert", accountName: "Tokopedia Seller Solutions", detail: "Disengagement signal · renewal in 45 days" },
    { type: "draft", accountName: "PT Mandiri Teknologi", detail: "Draft retention response prepared" },
    { type: "draft", accountName: "Tokopedia Seller Solutions", detail: "Draft re-engagement response prepared" },
    { type: "nudge", accountName: "Qasir", detail: "3-day silence after feature request — nudge sent" },
  ],
}

const ACCOUNTS: DemoAccount[] = [
  {
    id: "acc-mandiri",
    name: "PT Mandiri Teknologi",
    plan: "Growth",
    arr: 24000,
    arrAtRisk: 24000,
    health: 3,
    healthTrend: "falling",
    riskLevel: "critical",
    renewal: "Mar 2026",
    lastContact: "2d ago",
    signals: [
      {
        title: "Competitor comparison initiated",
        explanation: "Customer explicitly mentioned evaluating Qontak as an alternative this month",
        quote: "Kita lagi coba Qontak juga bulan ini, nanti kita compare hasilnya dulu ya Pak...",
        type: "risk",
        draft: "Halo Pak Budi, kami dengar Bapak sedang mengevaluasi beberapa solusi — sangat wajar! Kami ingin memastikan Bapak melihat value terbaru dari platform kami sebelum memutuskan. Boleh kita jadwalkan demo fitur baru kami minggu ini? Ada beberapa update yang sangat relevan dengan kebutuhan tim Bapak. 🙏",
      },
      {
        title: "Response time frustration",
        explanation: "Multiple messages went unanswered for 3+ days causing visible frustration",
        quote: "Sudah 3 hari belum ada balasan dari CS ya... harusnya ada SLA dong",
        type: "risk",
      },
    ],
  },
  {
    id: "acc-tokopedia",
    name: "Tokopedia Seller Solutions",
    plan: "Enterprise",
    arr: 36000,
    arrAtRisk: 18000,
    health: 4,
    healthTrend: "falling",
    riskLevel: "high",
    renewal: "Apr 2026",
    lastContact: "5d ago",
    signals: [
      {
        title: "Team disengagement detected",
        explanation: "Primary champion has gone silent for 5 days after raising a key integration issue",
        quote: "Fitur batch upload itu kapan selesainya? Tim kami sudah nunggu dari bulan lalu...",
        type: "risk",
        draft: "Halo Bu Sari! Kami mohon maaf atas keterlambatan update fitur batch upload. Kabar baiknya, fitur ini sudah masuk sprint terakhir dan estimasi release minggu depan. Boleh kami jadwalkan preview session untuk tim Anda sebelum launch resmi? Ingin memastikan onboarding-nya smooth. 🙏",
      },
    ],
  },
  {
    id: "acc-warungpintar",
    name: "Warung Pintar",
    plan: "Growth",
    arr: 18000,
    arrAtRisk: 4500,
    health: 5,
    healthTrend: "stable",
    riskLevel: "medium",
    renewal: "Jun 2026",
    lastContact: "1d ago",
    signals: [
      {
        title: "Repeated confusion on reporting module",
        explanation: "3 different team members asked about the same report configuration in the past week",
        quote: "Gimana cara export data bulanan ke format Excel? Udah coba tapi selalu error",
        type: "product",
      },
    ],
  },
  {
    id: "acc-qasir",
    name: "Qasir",
    plan: "Starter",
    arr: 8400,
    arrAtRisk: 0,
    health: 6,
    healthTrend: "stable",
    riskLevel: "medium",
    renewal: "Aug 2026",
    lastContact: "3d ago",
    signals: [
      {
        title: "Feature gap mentioned casually",
        explanation: "Customer mentioned a missing feature that competitor reportedly has",
        quote: "Teman saya yang pakai tools lain bilang ada fitur analitik real-time, kita bisa gak ya?",
        type: "product",
      },
    ],
  },
  {
    id: "acc-klinikku",
    name: "Klinikku",
    plan: "Growth",
    arr: 22000,
    arrAtRisk: 0,
    health: 8,
    healthTrend: "rising",
    riskLevel: "low",
    renewal: "Sep 2026",
    lastContact: "2d ago",
    signals: [],
    savedArr: 22000,
    savedAt: "last week",
  },
  {
    id: "acc-majoo",
    name: "Majoo POS",
    plan: "Enterprise",
    arr: 42000,
    arrAtRisk: 0,
    health: 9,
    healthTrend: "rising",
    riskLevel: "low",
    renewal: "Nov 2026",
    lastContact: "yesterday",
    signals: [],
    savedArr: 15000,
    savedAt: "2 weeks ago",
  },
  {
    id: "acc-mekari",
    name: "Mekari Jurnal",
    plan: "Enterprise",
    arr: 54000,
    arrAtRisk: 0,
    health: 9,
    healthTrend: "stable",
    riskLevel: "low",
    renewal: "Jan 2027",
    lastContact: "today",
    signals: [],
  },
  {
    id: "acc-gopay",
    name: "GoPay Merchant Tools",
    plan: "Growth",
    arr: 28000,
    arrAtRisk: 0,
    health: 7,
    healthTrend: "stable",
    riskLevel: "low",
    renewal: "Oct 2026",
    lastContact: "1d ago",
    signals: [],
  },
]

const READY_TO_SEND = ACCOUNTS
  .filter((a) => a.signals.some((s) => s.draft))
  .map((a) => {
    const signal = a.signals.find((s) => s.draft)!
    return { account: a, signal, draft: signal.draft! }
  })

const KPI = {
  total: ACCOUNTS.length,
  atRisk: ACCOUNTS.filter((a) => a.riskLevel === "critical" || a.riskLevel === "high").length,
  arrAtRisk: ACCOUNTS.reduce((sum, a) => sum + a.arrAtRisk, 0),
  saved: ACCOUNTS.filter((a) => a.savedArr).reduce((sum, a) => sum + (a.savedArr ?? 0), 0),
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatARR(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const riskConfig: Record<RiskLevel, { label: string; bg: string; text: string; border: string; dot: string }> = {
  critical: { label: "Critical", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  high: { label: "High", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  medium: { label: "Medium", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  low: { label: "Low", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WhatsAppIcon({ size = 12, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function AgentBriefCard() {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-2 w-2 relative flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-neutral-900">Nectic Agent</p>
          <span className="text-xs text-neutral-400">ran {timeAgo(AGENT_RUN.runAt)}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-neutral-400">{AGENT_RUN.accountsScanned} scanned</span>
          <span className="font-semibold text-orange-600">{AGENT_RUN.alertsSent} alerts sent</span>
          <span className="font-semibold text-emerald-600">{AGENT_RUN.readyCount} ready to send</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {AGENT_RUN.events.slice(0, 5).map((ev, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ev.type === "alert" ? "bg-orange-400" : ev.type === "nudge" ? "bg-amber-400" : "bg-emerald-400"}`} />
            <span className="font-medium text-neutral-700 truncate max-w-[140px]">{ev.accountName}</span>
            <span className="text-neutral-400 truncate">{ev.detail}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KPITile({ label, value, highlight }: { label: string; value: string; highlight?: "red" | "green" }) {
  const bg = highlight === "red" ? "bg-red-50 border-red-200" : highlight === "green" ? "bg-emerald-50 border-emerald-200" : "bg-white border-neutral-200"
  const vColor = highlight === "red" ? "text-red-600" : highlight === "green" ? "text-emerald-600" : "text-neutral-900"
  const lColor = highlight === "red" ? "text-red-400" : highlight === "green" ? "text-emerald-500" : "text-neutral-400"
  return (
    <div className={`border rounded-xl px-4 py-3.5 ${bg}`}>
      <p className={`text-xl font-bold tabular-nums leading-none mb-1 ${vColor}`}>{value}</p>
      <p className={`text-[11px] font-medium ${lColor}`}>{label}</p>
    </div>
  )
}

function ReadyToSendCard({
  account,
  signal,
  draft,
}: {
  account: DemoAccount
  signal: DemoSignal
  draft: string
}) {
  const [gone, setGone] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft)
    setGone(true)
    toast.success(`Draft copied — signal marked done`)
  }

  const handleSend = () => {
    toast.success(`Sent via WhatsApp — ${account.name} signal resolved`, {
      description: "In the real product this sends directly via WATI.",
    })
    setGone(true)
  }

  if (gone) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-white border border-emerald-200 rounded-xl overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50/60 border-b border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
        <span className="text-sm font-semibold text-neutral-900 truncate flex-1 min-w-0">{account.name}</span>
        <span className="text-xs text-neutral-400 truncate max-w-[200px] flex-shrink-0 hidden sm:inline">{signal.title}</span>
        <span className="text-xs text-orange-600 font-medium flex-shrink-0">{formatARR(account.arr)} ARR</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-neutral-600 leading-relaxed mb-3">&ldquo;{draft}&rdquo;</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy &amp; done
          </button>
          <button
            onClick={handleSend}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#25D366] text-white hover:bg-green-600 border border-green-600 transition-all"
          >
            <WhatsAppIcon size={11} className="text-white" />
            Send via WhatsApp
          </button>
          <span className="text-xs text-neutral-300 ml-auto hidden sm:inline">Demo — no real send</span>
        </div>
      </div>
    </motion.div>
  )
}

function AccountCard({ account }: { account: DemoAccount }) {
  const cfg = riskConfig[account.riskLevel]
  const healthColor = account.health <= 4 ? "text-red-600" : account.health <= 6 ? "text-amber-600" : "text-emerald-600"
  const trendIcon = account.healthTrend === "falling" ? "↓" : account.healthTrend === "rising" ? "↑" : "→"
  const trendColor = account.healthTrend === "falling" ? "text-red-400" : account.healthTrend === "rising" ? "text-emerald-500" : "text-neutral-400"

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4 hover:border-neutral-300 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900 leading-snug">{account.name}</p>
          <p className="text-xs text-neutral-400 mt-0.5">{account.plan} · {formatARR(account.arr)} ARR · Renewal {account.renewal}</p>
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border flex-shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${account.riskLevel === "critical" ? "animate-pulse" : ""}`} />
          {cfg.label}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div>
          <span className={`text-lg font-bold tabular-nums ${healthColor}`}>{account.health}</span>
          <span className="text-xs text-neutral-400">/10</span>
          <span className={`ml-1 text-xs font-medium ${trendColor}`}>{trendIcon}</span>
        </div>
        {account.arrAtRisk > 0 && (
          <div>
            <span className="text-xs text-red-500 font-semibold">{formatARR(account.arrAtRisk)}</span>
            <span className="text-xs text-neutral-400 ml-1">at risk</span>
          </div>
        )}
        {account.savedArr && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-emerald-600 font-semibold">{formatARR(account.savedArr)}</span>
            <span className="text-xs text-neutral-400">saved {account.savedAt}</span>
          </div>
        )}
      </div>

      {account.signals.length > 0 ? (
        <div className="space-y-1.5">
          {account.signals.slice(0, 2).map((sig, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${sig.type === "risk" ? "bg-red-400" : sig.type === "product" ? "bg-blue-400" : "bg-purple-400"}`} />
              <p className="text-xs text-neutral-600 leading-snug flex-1 min-w-0 truncate">{sig.title}</p>
              {sig.draft && (
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex-shrink-0">Draft ready</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-neutral-400">No active signals · last contact {account.lastContact}</p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [readyGone, setReadyGone] = useState<Set<string>>(new Set())

  const visibleReady = READY_TO_SEND.filter((r) => !readyGone.has(r.account.id))

  const handleDone = (accountId: string) => {
    setReadyGone((prev) => new Set([...prev, accountId]))
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Demo banner */}
      <div className="bg-neutral-900 text-white px-4 py-2.5 text-center">
        <p className="text-xs font-medium">
          <span className="text-neutral-400 mr-2">DEMO</span>
          This is a live preview with realistic data — no login required.
          <Link href="/concept/login" className="ml-3 text-emerald-400 hover:text-emerald-300 underline transition-colors">
            Access real product →
          </Link>
        </p>
      </div>

      {/* Nav */}
      <nav className="bg-white border-b border-neutral-100 px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-bold text-neutral-900 tracking-tight">nectic</Link>
            <span className="text-neutral-200 text-sm">|</span>
            <span className="text-sm text-neutral-500">Demo workspace</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <Link href="/concept/demo/board" className="hover:text-neutral-900 transition-colors font-medium">
              Action inbox
              <span className="ml-1.5 bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>
            </Link>
            <Link href="/concept/login" className="bg-neutral-900 text-white px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-5">

        {/* Agent brief */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <AgentBriefCard />
        </motion.div>

        {/* KPI grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <KPITile label="Accounts monitored" value={String(KPI.total)} />
          <KPITile label="At risk (critical/high)" value={String(KPI.atRisk)} highlight="red" />
          <KPITile label="ARR at risk" value={formatARR(KPI.arrAtRisk)} highlight="red" />
          <KPITile label="ARR saved this month" value={formatARR(KPI.saved)} highlight="green" />
        </motion.div>

        {/* Ready to send */}
        {visibleReady.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <h2 className="text-xs font-semibold text-neutral-700">
                Ready to send — {visibleReady.length} draft{visibleReady.length !== 1 ? "s" : ""} prepared by agent
              </h2>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {visibleReady.map(({ account, signal, draft }) => (
                  <ReadyToSendCard
                    key={account.id}
                    account={account}
                    signal={signal}
                    draft={draft}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Account grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">All accounts</h2>
            <span className="text-xs text-neutral-400">{ACCOUNTS.length} accounts · last scan {timeAgo(AGENT_RUN.runAt)}</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ACCOUNTS.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-neutral-900 rounded-xl px-6 py-6 text-center"
        >
          <p className="text-white font-semibold mb-1.5">This is what your real accounts could look like.</p>
          <p className="text-neutral-400 text-sm mb-5 max-w-lg mx-auto">
            Upload any WhatsApp group export and Nectic detects churn signals, drafts responses in Bahasa Indonesia, and tracks your ARR saved — in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/concept/login"
              className="inline-flex items-center justify-center bg-white text-neutral-900 text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              Start protecting your NRR →
            </Link>
            <Link
              href="#early-access"
              className="inline-flex items-center justify-center text-neutral-400 text-sm px-6 py-2.5 rounded-lg border border-neutral-700 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
            >
              Talk to the founder
            </Link>
          </div>
        </motion.div>

      </main>
    </div>
  )
}
