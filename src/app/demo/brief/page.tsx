import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { demoWeek, demoSignals } from "@/lib/demo-data"

const priorityConfig = {
  critical: { label: "Critical", dot: "bg-red-500", badge: "bg-red-50 text-red-600 border-red-100", bar: "bg-red-400" },
  medium: { label: "Medium", dot: "bg-yellow-500", badge: "bg-yellow-50 text-yellow-700 border-yellow-100", bar: "bg-yellow-400" },
  low: { label: "Low", dot: "bg-neutral-300", badge: "bg-neutral-50 text-neutral-500 border-neutral-200", bar: "bg-neutral-300" },
}

const sourceLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  zoom: "Zoom",
  hubspot: "HubSpot",
}

const maxMentions = Math.max(...demoSignals.map((s) => s.mentions))

export default function BriefPage() {
  const criticalSignals = demoSignals.filter((s) => s.priority === "critical")
  const mediumSignals = demoSignals.filter((s) => s.priority === "medium")
  const lowSignals = demoSignals.filter((s) => s.priority === "low")

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-neutral-100 px-6 py-4 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/demo/conversations" className="text-neutral-400 hover:text-neutral-700 text-sm transition-colors">
              ← Conversations
            </Link>
            <div className="w-px h-4 bg-neutral-200" />
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon size={20} />
              <span className="text-sm font-medium text-neutral-900">Nectic</span>
            </Link>
          </div>
          <span className="text-xs text-neutral-400 bg-neutral-50 border border-neutral-200 px-3 py-1 rounded-full hidden sm:inline">
            Step 03 of 05
          </span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="pb-8 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-neutral-300">03 → 04</span>
            <span className="text-xs text-neutral-400">Signals extracted + brief delivered</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-light text-neutral-900 tracking-tight">
                Week of {demoWeek.period}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">{demoWeek.company} · Product intelligence brief</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-neutral-400">Delivered via Slack + email</p>
              <p className="text-xs text-neutral-400 mt-0.5">Every Monday, 8:00 AM</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { value: demoWeek.stats.conversations, label: "conversations" },
              { value: demoWeek.stats.signals, label: "signals found" },
              { value: demoWeek.stats.critical, color: "text-red-500", label: "critical" },
              { value: demoWeek.stats.dealsAtRisk, color: "text-orange-500", label: "deals at risk" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className={`text-2xl font-light ${stat.color ?? "text-neutral-900"}`}>{stat.value}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Critical signals */}
        <SignalSection title="Critical" count={criticalSignals.length} note="act this sprint" dot="bg-red-500" signals={criticalSignals} maxMentions={maxMentions} />
        <SignalSection title="Medium" count={mediumSignals.length} note="plan next quarter" dot="bg-yellow-500" signals={mediumSignals} maxMentions={maxMentions} />
        <SignalSection title="Low" count={lowSignals.length} note="backlog" dot="bg-neutral-300" signals={lowSignals} maxMentions={maxMentions} />

        {/* PM Actions */}
        <section className="mt-12 border-t border-neutral-100 pt-10">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-6">
            Suggested PM actions this week
          </p>
          <div className="space-y-3">
            {demoSignals
              .filter((s) => s.priority === "critical" || s.priority === "medium")
              .map((signal) => {
                const cfg = priorityConfig[signal.priority]
                return (
                  <div key={signal.id} className="flex items-start gap-4 py-3 border-b border-neutral-50">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-700">{signal.suggestedTicket.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {signal.suggestedTicket.priority} · {signal.suggestedTicket.estimate}
                        {signal.ticketStatus === "created" && (
                          <span className="ml-2 text-indigo-600 font-medium">✓ {signal.ticketId} created</span>
                        )}
                      </p>
                    </div>
                    <Link href={`/demo/insight/${signal.id}`} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors flex-shrink-0">
                      View →
                    </Link>
                  </div>
                )
              })}
          </div>
        </section>

        {/* Footer CTA */}
        <div className="mt-16 pt-10 border-t border-neutral-100 text-center">
          <p className="text-sm text-neutral-500">This is what lands in your PM&apos;s inbox every Monday.</p>
          <p className="mt-1 text-sm text-neutral-400">No surveys. No tagging. No behavior change from your sales team.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/#early-access" className="inline-flex items-center justify-center bg-neutral-900 text-white text-sm font-medium px-6 py-3 hover:bg-neutral-700 transition-colors">
              Get early access
            </Link>
            <Link href="/demo" className="inline-flex items-center justify-center text-sm text-neutral-500 px-6 py-3 hover:text-neutral-900 transition-colors">
              ← Back to pipeline
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function SignalSection({ title, count, note, dot, signals, maxMentions }: {
  title: string; count: number; note: string; dot: string
  signals: typeof demoSignals; maxMentions: number
}) {
  if (count === 0) return null
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3 mb-4">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <h2 className="text-xs font-medium text-neutral-900 uppercase tracking-widest">{title}</h2>
        <span className="text-xs text-neutral-400">({count} — {note})</span>
      </div>
      <div className="space-y-3">
        {signals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} maxMentions={maxMentions} />
        ))}
      </div>
    </section>
  )
}

function SignalCard({ signal, maxMentions }: { signal: typeof demoSignals[0]; maxMentions: number }) {
  const cfg = priorityConfig[signal.priority]
  const barWidth = Math.round((signal.mentions / maxMentions) * 100)

  return (
    <Link href={`/demo/insight/${signal.id}`} className="block border border-neutral-100 hover:border-neutral-300 hover:shadow-sm transition-all p-5 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 border rounded-full ${cfg.badge}`}>{cfg.label}</span>
            <span className="text-xs text-neutral-400 border border-neutral-100 px-2 py-0.5 rounded-full">{signal.category}</span>
            {/* Source channels */}
            {signal.sources.map((src) => (
              <span key={src} className="text-xs text-neutral-400 border border-neutral-100 px-2 py-0.5 rounded-full">
                {sourceLabels[src] ?? src}
              </span>
            ))}
            {signal.ticketStatus === "created" && (
              <span className="text-xs text-indigo-600 border border-indigo-100 bg-indigo-50 px-2 py-0.5 rounded-full">
                ✓ {signal.ticketId}
              </span>
            )}
          </div>
          <h3 className="mt-2 text-base font-medium text-neutral-900 group-hover:text-neutral-700">{signal.title}</h3>
          <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{signal.headline}</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 bg-neutral-100 rounded-full h-1">
              <div className={`h-1 rounded-full ${cfg.bar}`} style={{ width: `${barWidth}%` }} />
            </div>
            <span className="text-xs text-neutral-500 flex-shrink-0 font-medium">{signal.mentions} mentions</span>
          </div>
          <div className="mt-3 flex items-start gap-2">
            <span className="text-xs text-neutral-400 flex-shrink-0 mt-0.5">Sales said:</span>
            <span className="text-xs text-neutral-500 italic">&ldquo;{signal.salesSummary}&rdquo;</span>
          </div>
        </div>
        <span className="text-neutral-300 group-hover:text-neutral-500 transition-colors flex-shrink-0 mt-1 text-sm">→</span>
      </div>
    </Link>
  )
}
