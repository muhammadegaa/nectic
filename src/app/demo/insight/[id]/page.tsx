import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { notFound } from "next/navigation"
import { demoSignals } from "@/lib/demo-data"

const priorityConfig = {
  critical: { label: "Critical", badge: "bg-red-50 text-red-600 border-red-100" },
  medium: { label: "Medium", badge: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  low: { label: "Low", badge: "bg-neutral-50 text-neutral-500 border-neutral-200" },
}

const sourceConfig: Record<string, { label: string; color: string }> = {
  whatsapp: { label: "WhatsApp", color: "bg-green-50 text-green-700 border-green-100" },
  zoom: { label: "Zoom", color: "bg-blue-50 text-blue-700 border-blue-100" },
  hubspot: { label: "HubSpot", color: "bg-orange-50 text-orange-700 border-orange-100" },
}

export function generateStaticParams() {
  return demoSignals.map((s) => ({ id: s.id }))
}

export default function InsightPage({ params }: { params: { id: string } }) {
  const signal = demoSignals.find((s) => s.id === params.id)
  if (!signal) notFound()

  const cfg = priorityConfig[signal.priority]
  const currentIndex = demoSignals.findIndex((s) => s.id === params.id)
  const nextSignal = demoSignals[currentIndex + 1] ?? null
  const prevSignal = demoSignals[currentIndex - 1] ?? null
  const isTicketCreated = signal.ticketStatus === "created"

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-neutral-100 px-6 py-4 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/demo/brief" className="text-neutral-400 hover:text-neutral-700 text-sm transition-colors">
              ← Brief
            </Link>
            <div className="w-px h-4 bg-neutral-200" />
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon size={20} />
              <span className="text-sm font-medium text-neutral-900">Nectic</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {prevSignal && (
              <Link href={`/demo/insight/${prevSignal.id}`} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors px-3 py-1.5 border border-neutral-200 hover:border-neutral-300">
                ← Prev
              </Link>
            )}
            {nextSignal && (
              <Link href={`/demo/insight/${nextSignal.id}`} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors px-3 py-1.5 border border-neutral-200 hover:border-neutral-300">
                Next →
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Signal header */}
        <div className="pb-8 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-neutral-300">05</span>
            <span className="text-xs text-neutral-400">Signal → ticket</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 border rounded-full ${cfg.badge}`}>{cfg.label}</span>
            <span className="text-xs text-neutral-400 border border-neutral-100 px-2 py-0.5 rounded-full">{signal.category}</span>
            {signal.sources.map((src) => (
              <span key={src} className={`text-xs px-2 py-0.5 border rounded-full ${sourceConfig[src]?.color ?? ""}`}>
                {sourceConfig[src]?.label ?? src}
              </span>
            ))}
            <span className="text-xs text-neutral-400">{signal.mentions} mentions</span>
          </div>
          <h1 className="mt-3 text-2xl font-light text-neutral-900 tracking-tight">{signal.title}</h1>
          <p className="mt-2 text-base text-neutral-500">{signal.headline}</p>
        </div>

        {/* What sales said vs customers said */}
        <section className="mt-10">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
            The gap Nectic found
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-neutral-100 p-5">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">What sales reported to PM</p>
              <p className="text-sm text-neutral-600 italic leading-relaxed">&ldquo;{signal.salesSummary}&rdquo;</p>
              <p className="mt-4 text-xs text-neutral-300">— Sprint planning notes</p>
            </div>
            <div className="border border-neutral-900 bg-neutral-900 p-5">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">What customers actually said</p>
              <p className="text-sm text-white italic leading-relaxed">&ldquo;{signal.quotes[0].translated}&rdquo;</p>
              <p className="mt-4 text-xs text-neutral-500">— {signal.quotes[0].sender}</p>
            </div>
          </div>
        </section>

        {/* Source conversations */}
        <section className="mt-10">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-5">
            Source conversations ({signal.quotes.length} shown of {signal.mentions})
          </p>
          <div className="space-y-4">
            {signal.quotes.map((quote) => {
              const srcCfg = sourceConfig[quote.source] ?? { label: quote.source, color: "" }
              return (
                <div key={quote.id} className="border border-neutral-100 p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 border rounded-full ${srcCfg.color}`}>{srcCfg.label}</span>
                      <span className="text-xs font-medium text-neutral-600">{quote.sender}</span>
                    </div>
                    <span className="text-xs text-neutral-400 flex-shrink-0">{quote.date}</span>
                  </div>
                  <p className="text-sm text-neutral-400 leading-relaxed">{quote.raw}</p>
                  <div className="mt-3 pt-3 border-t border-neutral-50">
                    <p className="text-xs text-neutral-400 mb-1">English</p>
                    <p className="text-sm text-neutral-700 leading-relaxed italic">&ldquo;{quote.translated}&rdquo;</p>
                  </div>
                </div>
              )
            })}
            {signal.mentions > signal.quotes.length && (
              <div className="border border-dashed border-neutral-200 p-5 text-center">
                <p className="text-sm text-neutral-400">+{signal.mentions - signal.quotes.length} more conversations in the full report</p>
                <Link href="/#early-access" className="mt-2 inline-block text-xs text-neutral-500 hover:text-neutral-900 underline transition-colors">
                  Get access to see all →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Competitors */}
        {signal.competitors.length > 0 && (
          <section className="mt-10">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">Competitors mentioned in same context</p>
            <div className="flex gap-2 flex-wrap">
              {signal.competitors.map((c) => (
                <span key={c} className="text-xs text-neutral-600 border border-neutral-200 bg-neutral-50 px-3 py-1.5 rounded-full">{c}</span>
              ))}
            </div>
          </section>
        )}

        {/* Ticket — the 05 step */}
        <section className="mt-10 border-t border-neutral-100 pt-10">
          <div className="flex items-center justify-between gap-4 mb-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Suggested PM ticket</p>
            {isTicketCreated && (
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                ✓ {signal.ticketId} created in Jira
              </span>
            )}
          </div>
          <div className="border border-neutral-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base font-medium text-neutral-900">{signal.suggestedTicket.title}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono text-neutral-500 border border-neutral-200 px-2 py-0.5">{signal.suggestedTicket.priority}</span>
                <span className="text-xs text-neutral-400">{signal.suggestedTicket.estimate}</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-neutral-500 leading-relaxed">{signal.suggestedTicket.description}</p>
            <div className="mt-4 flex gap-2 flex-wrap">
              {signal.suggestedTicket.labels.map((label) => (
                <span key={label} className="text-xs text-neutral-500 border border-neutral-100 bg-neutral-50 px-2 py-0.5 font-mono">{label}</span>
              ))}
            </div>

            {/* Ticket action */}
            <div className="mt-5 pt-4 border-t border-neutral-100">
              {isTicketCreated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-indigo-600">✓ {signal.ticketId} — created Feb 21, 2026</span>
                  </div>
                  {/* Resolution tracking */}
                  <div className="bg-neutral-50 border border-neutral-100 p-4">
                    <p className="text-xs font-medium text-neutral-500 mb-3">Resolution tracking</p>
                    <div className="space-y-2">
                      {[
                        { date: "Feb 21", event: "Signal surfaced in weekly brief", done: true },
                        { date: "Feb 21", event: `${signal.ticketId} created in Jira by PM`, done: true },
                        { date: "Mar 3", event: "Sprint started — assigned to Eng", done: true },
                        { date: "Mar 17", event: "Shipped to production", done: false },
                        { date: "Mar 24", event: "Nectic measures: did complaints drop?", done: false },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className={`mt-0.5 w-3 h-3 rounded-full border flex-shrink-0 flex items-center justify-center ${item.done ? "bg-neutral-900 border-neutral-900" : "border-neutral-300 bg-white"}`}>
                            {item.done && <span className="text-white text-[8px]">✓</span>}
                          </span>
                          <div className="flex gap-3 flex-1 min-w-0">
                            <span className="text-xs text-neutral-400 flex-shrink-0 w-12">{item.date}</span>
                            <span className={`text-xs ${item.done ? "text-neutral-700" : "text-neutral-400"}`}>{item.event}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <Link href="/#early-access" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                    Connect Jira / Linear to auto-create tickets →
                  </Link>
                  <span className="text-xs text-neutral-400 border border-dashed border-neutral-200 px-3 py-1.5">Pending</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-neutral-100 flex items-center justify-between gap-4">
          <div>
            {prevSignal ? (
              <Link href={`/demo/insight/${prevSignal.id}`} className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
                ← {prevSignal.title}
              </Link>
            ) : (
              <Link href="/demo/brief" className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
                ← Back to brief
              </Link>
            )}
          </div>
          <div>
            {nextSignal ? (
              <Link href={`/demo/insight/${nextSignal.id}`} className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
                {nextSignal.title} →
              </Link>
            ) : (
              <Link href="/#early-access" className="text-sm text-neutral-900 font-medium hover:opacity-70 transition-opacity">
                Get early access →
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
