import Link from "next/link"
import DemoLayout from "@/components/demo-layout"
import { WhatsAppIcon, ZoomIcon, HubSpotIcon, FirefliesIcon } from "@/components/brand-icons"
import { demoWeek, demoSignals } from "@/lib/demo-data"

const priorityConfig = {
  critical: { label: "Critical", dot: "bg-red-500", badge: "bg-red-50 text-red-600 border-red-200", bar: "bg-red-400", glow: "shadow-red-100" },
  medium: { label: "Medium", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200", bar: "bg-amber-400", glow: "" },
  low: { label: "Low", dot: "bg-neutral-300", badge: "bg-neutral-100 text-neutral-500 border-neutral-200", bar: "bg-neutral-300", glow: "" },
}

const sourceIconMap: Record<string, React.FC<{ size?: number }>> = {
  whatsapp: WhatsAppIcon,
  zoom: ZoomIcon,
  hubspot: HubSpotIcon,
  fireflies: FirefliesIcon,
}

const maxMentions = Math.max(...demoSignals.map((s) => s.mentions))

export default function BriefPage() {
  const criticalSignals = demoSignals.filter((s) => s.priority === "critical")
  const mediumSignals = demoSignals.filter((s) => s.priority === "medium")
  const lowSignals = demoSignals.filter((s) => s.priority === "low")

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-3">
            <span className="font-mono">Step 03</span>
            <span>·</span>
            <span>Weekly product intelligence brief</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">
                Week of {demoWeek.period}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {demoWeek.company} · Delivered Mon 8:00 AM via Slack + email
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 bg-white border border-neutral-200 px-3 py-1.5 rounded">
                📧 product@aksara.id
              </span>
              <span className="text-xs text-neutral-500 bg-white border border-neutral-200 px-3 py-1.5 rounded">
                📢 #product
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: demoWeek.stats.conversations, label: "conversations read", sub: "across 3 sources" },
              { value: demoWeek.stats.signals, label: "signals found", sub: "vs 8 last week" },
              { value: demoWeek.stats.critical, label: "critical", sub: "act this sprint", color: "text-red-500" },
              { value: demoWeek.stats.dealsAtRisk, label: "deals at risk", sub: "~IDR 420M ARR", color: "text-amber-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
                <p className={`text-2xl font-semibold ${s.color ?? "text-neutral-900"}`}>{s.value}</p>
                <p className="text-xs font-medium text-neutral-600 mt-0.5">{s.label}</p>
                <p className="text-xs text-neutral-400">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Signal sections */}
        <SignalGroup title="Critical" note="Act this sprint" dot="bg-red-500" count={criticalSignals.length} signals={criticalSignals} maxMentions={maxMentions} />
        <SignalGroup title="Medium" note="Plan next quarter" dot="bg-amber-500" count={mediumSignals.length} signals={mediumSignals} maxMentions={maxMentions} />
        <SignalGroup title="Low" note="Backlog" dot="bg-neutral-300" count={lowSignals.length} signals={lowSignals} maxMentions={maxMentions} />

        {/* PM Actions */}
        <div className="mt-10 bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-800">Suggested actions this sprint</p>
            <span className="text-xs text-neutral-400">{demoSignals.filter(s => s.priority !== "low").length} items</span>
          </div>
          <div className="divide-y divide-neutral-100">
            {demoSignals.filter((s) => s.priority !== "low").map((signal) => {
              const cfg = priorityConfig[signal.priority]
              return (
                <div key={signal.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 transition-colors">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-800 truncate">{signal.suggestedTicket.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {signal.suggestedTicket.priority} · {signal.suggestedTicket.estimate}
                      {signal.ticketStatus === "created" && (
                        <span className="ml-2 text-indigo-600 font-medium">✓ {signal.ticketId}</span>
                      )}
                    </p>
                  </div>
                  <Link href={`/demo/insight/${signal.id}`} className="flex-shrink-0 text-xs text-neutral-400 hover:text-neutral-700 font-medium transition-colors">
                    View →
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Link href="/demo/conversations" className="text-sm text-neutral-500 px-4 py-2 border border-neutral-200 rounded hover:border-neutral-300 transition-colors">
            ← Conversations
          </Link>
          <Link href="/demo/insight/payroll-sync-gap" className="text-sm font-medium text-white bg-neutral-900 px-4 py-2 rounded hover:bg-neutral-700 transition-colors">
            Drill into top signal →
          </Link>
        </div>
      </div>
    </DemoLayout>
  )
}

function SignalGroup({ title, note, dot, count, signals, maxMentions }: {
  title: string; note: string; dot: string; count: number
  signals: typeof demoSignals; maxMentions: number
}) {
  if (!count) return null
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="text-sm font-semibold text-neutral-700">{title}</span>
        <span className="text-xs text-neutral-400">· {count} signal{count !== 1 ? "s" : ""} · {note}</span>
      </div>
      <div className="space-y-2">
        {signals.map((s) => <SignalCard key={s.id} signal={s} maxMentions={maxMentions} />)}
      </div>
    </div>
  )
}

function SignalCard({ signal, maxMentions }: { signal: typeof demoSignals[0]; maxMentions: number }) {
  const cfg = priorityConfig[signal.priority]
  const barWidth = Math.round((signal.mentions / maxMentions) * 100)

  return (
    <Link href={`/demo/insight/${signal.id}`} className={`group block bg-white border border-neutral-200 rounded-lg p-4 hover:border-neutral-400 hover:shadow-sm transition-all ${signal.priority === "critical" ? cfg.glow : ""}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 border rounded-full ${cfg.badge}`}>{cfg.label}</span>
            <span className="text-xs text-neutral-400 border border-neutral-100 px-2 py-0.5 rounded-full bg-neutral-50">{signal.category}</span>
            {/* Source icons */}
            <div className="flex items-center gap-1">
              {signal.sources.map((src) => {
                const Icon = sourceIconMap[src]
                return Icon ? <Icon key={src} size={14} /> : null
              })}
            </div>
            {signal.ticketStatus === "created" && (
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">✓ {signal.ticketId}</span>
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-neutral-900 group-hover:text-neutral-700">{signal.title}</p>
          <p className="mt-1 text-xs text-neutral-500 line-clamp-2 leading-relaxed">{signal.headline}</p>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 bg-neutral-100 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full transition-all ${cfg.bar}`} style={{ width: `${barWidth}%` }} />
            </div>
            <span className="text-xs text-neutral-600 font-semibold flex-shrink-0">{signal.mentions} mentions</span>
            <span className="text-xs text-neutral-400 flex-shrink-0">{signal.trend}</span>
          </div>

          <div className="mt-2.5 flex items-start gap-2">
            <span className="text-xs text-neutral-400 flex-shrink-0">Sales said:</span>
            <span className="text-xs text-neutral-500 italic">&ldquo;{signal.salesSummary}&rdquo;</span>
          </div>
        </div>
        <span className="text-neutral-300 group-hover:text-neutral-600 transition-colors flex-shrink-0 text-base mt-1">→</span>
      </div>
    </Link>
  )
}
