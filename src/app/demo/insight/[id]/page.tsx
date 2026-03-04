import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { notFound } from "next/navigation"
import { demoSignals } from "@/lib/demo-data"

const priorityConfig = {
  critical: { label: "Critical", badge: "bg-red-50 text-red-600 border-red-100" },
  medium: { label: "Medium", badge: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  low: { label: "Low", badge: "bg-neutral-50 text-neutral-500 border-neutral-200" },
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
              <Link
                href={`/demo/insight/${prevSignal.id}`}
                className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors px-3 py-1.5 border border-neutral-200 hover:border-neutral-300"
              >
                ← Prev
              </Link>
            )}
            {nextSignal && (
              <Link
                href={`/demo/insight/${nextSignal.id}`}
                className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors px-3 py-1.5 border border-neutral-200 hover:border-neutral-300"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Signal header */}
        <div className="pb-8 border-b border-neutral-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 border rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-neutral-400 border border-neutral-100 px-2 py-0.5 rounded-full">
              {signal.category}
            </span>
            <span className="text-xs text-neutral-400">
              {signal.mentions} mentions · Week of Feb 17–21
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-light text-neutral-900 tracking-tight">{signal.title}</h1>
          <p className="mt-2 text-base text-neutral-500">{signal.headline}</p>
        </div>

        {/* What sales said vs what customers said */}
        <section className="mt-10">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="border border-neutral-100 p-5">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">
                What sales reported to PM
              </p>
              <p className="text-sm text-neutral-600 italic leading-relaxed">
                &ldquo;{signal.salesSummary}&rdquo;
              </p>
              <p className="mt-4 text-xs text-neutral-300">— Aggregated from sprint planning notes</p>
            </div>
            <div className="border border-neutral-900 p-5 bg-neutral-900">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">
                What customers actually said
              </p>
              <p className="text-sm text-white italic leading-relaxed">
                &ldquo;{signal.quotes[0].translated}&rdquo;
              </p>
              <p className="mt-4 text-xs text-neutral-500">— {signal.quotes[0].sender}</p>
            </div>
          </div>
        </section>

        {/* All quotes */}
        <section className="mt-10">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-5">
            Source conversations ({signal.quotes.length} shown of {signal.mentions})
          </p>
          <div className="space-y-4">
            {signal.quotes.map((quote) => (
              <div key={quote.id} className="border border-neutral-100 p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <span className="text-xs font-medium text-neutral-600">{quote.sender}</span>
                  <span className="text-xs text-neutral-400 flex-shrink-0">{quote.date}</span>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {quote.raw}
                </p>
                <div className="mt-3 pt-3 border-t border-neutral-50">
                  <p className="text-xs text-neutral-400 mb-1">English</p>
                  <p className="text-sm text-neutral-700 leading-relaxed italic">
                    &ldquo;{quote.translated}&rdquo;
                  </p>
                </div>
              </div>
            ))}
            {signal.mentions > signal.quotes.length && (
              <div className="border border-dashed border-neutral-200 p-5 text-center">
                <p className="text-sm text-neutral-400">
                  +{signal.mentions - signal.quotes.length} more conversations in the full report
                </p>
                <Link
                  href="/#early-access"
                  className="mt-2 inline-block text-xs text-neutral-500 hover:text-neutral-900 underline transition-colors"
                >
                  Get access to see all →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Competitors */}
        {signal.competitors.length > 0 && (
          <section className="mt-10">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
              Competitors mentioned in same context
            </p>
            <div className="flex gap-2 flex-wrap">
              {signal.competitors.map((c) => (
                <span
                  key={c}
                  className="text-xs text-neutral-600 border border-neutral-200 bg-neutral-50 px-3 py-1.5 rounded-full"
                >
                  {c}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Suggested ticket */}
        <section className="mt-10 border-t border-neutral-100 pt-10">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-5">
            Suggested PM ticket
          </p>
          <div className="border border-neutral-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base font-medium text-neutral-900">
                {signal.suggestedTicket.title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono text-neutral-500 border border-neutral-200 px-2 py-0.5">
                  {signal.suggestedTicket.priority}
                </span>
                <span className="text-xs text-neutral-400">{signal.suggestedTicket.estimate}</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
              {signal.suggestedTicket.description}
            </p>
            <div className="mt-4 flex gap-2 flex-wrap">
              {signal.suggestedTicket.labels.map((label) => (
                <span
                  key={label}
                  className="text-xs text-neutral-500 border border-neutral-100 bg-neutral-50 px-2 py-0.5 font-mono"
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-neutral-100">
              <Link
                href="/#early-access"
                className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Connect your Jira / Linear to auto-create tickets →
              </Link>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-neutral-100 flex items-center justify-between gap-4">
          <div>
            {prevSignal ? (
              <Link
                href={`/demo/insight/${prevSignal.id}`}
                className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
              >
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
              <Link
                href={`/demo/insight/${nextSignal.id}`}
                className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
              >
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
