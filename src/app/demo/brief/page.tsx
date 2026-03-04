import Link from "next/link"
import Image from "next/image"
import { demoWeek, demoSignals } from "@/lib/demo-data"

const priorityConfig = {
  critical: { label: "Critical", dot: "bg-red-500", badge: "bg-red-50 text-red-600 border-red-100", bar: "bg-red-400" },
  medium: { label: "Medium", dot: "bg-yellow-500", badge: "bg-yellow-50 text-yellow-700 border-yellow-100", bar: "bg-yellow-400" },
  low: { label: "Low", dot: "bg-neutral-300", badge: "bg-neutral-50 text-neutral-500 border-neutral-200", bar: "bg-neutral-300" },
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
            <Link href="/demo" className="text-neutral-400 hover:text-neutral-700 text-sm transition-colors">
              ← Demo
            </Link>
            <div className="w-px h-4 bg-neutral-200" />
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo-nectic-icon.png" alt="Nectic" width={20} height={20} className="rounded" />
              <span className="text-sm font-medium text-neutral-900">Nectic</span>
            </Link>
          </div>
          <span className="text-xs text-neutral-400 bg-neutral-50 border border-neutral-200 px-3 py-1 rounded-full hidden sm:inline">
            Interactive demo
          </span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="pb-8 border-b border-neutral-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">
                Product intelligence brief
              </p>
              <h1 className="mt-2 text-2xl font-light text-neutral-900 tracking-tight">
                Week of {demoWeek.period}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">{demoWeek.company}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-neutral-400">Delivered by Nectic</p>
              <p className="text-xs text-neutral-400 mt-0.5">Every Monday, 8:00 AM</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-2xl font-light text-neutral-900">{demoWeek.stats.conversations}</p>
              <p className="mt-0.5 text-xs text-neutral-400">conversations analyzed</p>
            </div>
            <div>
              <p className="text-2xl font-light text-neutral-900">{demoWeek.stats.signals}</p>
              <p className="mt-0.5 text-xs text-neutral-400">signals found</p>
            </div>
            <div>
              <p className="text-2xl font-light text-red-500">{demoWeek.stats.critical}</p>
              <p className="mt-0.5 text-xs text-neutral-400">critical this week</p>
            </div>
            <div>
              <p className="text-2xl font-light text-orange-500">{demoWeek.stats.dealsAtRisk}</p>
              <p className="mt-0.5 text-xs text-neutral-400">deals at risk</p>
            </div>
          </div>
        </div>

        {/* Critical signals */}
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <h2 className="text-xs font-medium text-neutral-900 uppercase tracking-widest">Critical</h2>
            <span className="text-xs text-neutral-400">({criticalSignals.length} signals — act this sprint)</span>
          </div>
          <div className="space-y-3">
            {criticalSignals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} maxMentions={maxMentions} />
            ))}
          </div>
        </section>

        {/* Medium signals */}
        <section className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <h2 className="text-xs font-medium text-neutral-900 uppercase tracking-widest">Medium</h2>
            <span className="text-xs text-neutral-400">({mediumSignals.length} signals — plan next quarter)</span>
          </div>
          <div className="space-y-3">
            {mediumSignals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} maxMentions={maxMentions} />
            ))}
          </div>
        </section>

        {/* Low signals */}
        <section className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-neutral-300" />
            <h2 className="text-xs font-medium text-neutral-900 uppercase tracking-widest">Low</h2>
            <span className="text-xs text-neutral-400">({lowSignals.length} signals — backlog)</span>
          </div>
          <div className="space-y-3">
            {lowSignals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} maxMentions={maxMentions} />
            ))}
          </div>
        </section>

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
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-700">{signal.suggestedTicket.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {signal.suggestedTicket.priority} · {signal.suggestedTicket.estimate}
                      </p>
                    </div>
                    <Link
                      href={`/demo/insight/${signal.id}`}
                      className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors flex-shrink-0"
                    >
                      View →
                    </Link>
                  </div>
                )
              })}
          </div>
        </section>

        {/* Footer CTA */}
        <div className="mt-16 pt-10 border-t border-neutral-100 text-center">
          <p className="text-sm text-neutral-500">
            This is what Nectic delivers to your PM every Monday.
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            No surveys. No tagging. No behavior change from your sales team.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/#early-access"
              className="inline-flex items-center justify-center bg-neutral-900 text-white text-sm font-medium px-6 py-3 hover:bg-neutral-700 transition-colors"
            >
              Get early access
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center text-sm text-neutral-500 px-6 py-3 hover:text-neutral-900 transition-colors"
            >
              ← Back to demo overview
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function SignalCard({
  signal,
  maxMentions,
}: {
  signal: (typeof demoSignals)[0]
  maxMentions: number
}) {
  const cfg = priorityConfig[signal.priority]
  const barWidth = Math.round((signal.mentions / maxMentions) * 100)

  return (
    <Link
      href={`/demo/insight/${signal.id}`}
      className="block border border-neutral-100 hover:border-neutral-300 hover:shadow-sm transition-all p-5 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 border rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-neutral-400 border border-neutral-100 px-2 py-0.5 rounded-full">
              {signal.category}
            </span>
            {signal.trend === "new" && (
              <span className="text-xs text-blue-600 border border-blue-100 bg-blue-50 px-2 py-0.5 rounded-full">
                New
              </span>
            )}
          </div>
          <h3 className="mt-2 text-base font-medium text-neutral-900 group-hover:text-neutral-700">
            {signal.title}
          </h3>
          <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{signal.headline}</p>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 bg-neutral-100 rounded-full h-1">
              <div className={`h-1 rounded-full ${cfg.bar}`} style={{ width: `${barWidth}%` }} />
            </div>
            <span className="text-xs text-neutral-500 flex-shrink-0 font-medium">
              {signal.mentions} mentions
            </span>
          </div>

          <div className="mt-3 flex items-start gap-2">
            <span className="text-xs text-neutral-400 flex-shrink-0 mt-0.5">Sales said:</span>
            <span className="text-xs text-neutral-500 italic">&ldquo;{signal.salesSummary}&rdquo;</span>
          </div>
        </div>
        <span className="text-neutral-300 group-hover:text-neutral-500 transition-colors flex-shrink-0 mt-1 text-sm">
          →
        </span>
      </div>
    </Link>
  )
}
