import Link from "next/link"
import DemoLayout from "@/components/demo-layout"
import { notFound } from "next/navigation"
import { demoSignals } from "@/lib/demo-data"
import { WhatsAppIcon, ZoomIcon, HubSpotIcon, FirefliesIcon, JiraIcon } from "@/components/brand-icons"

const priorityConfig = {
  critical: { label: "Critical", badge: "bg-red-50 text-red-600 border-red-200" },
  medium: { label: "Medium", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  low: { label: "Low", badge: "bg-neutral-100 text-neutral-500 border-neutral-200" },
}

const sourceConfig: Record<string, { Icon: React.FC<{ size?: number }>; label: string; bg: string; text: string }> = {
  whatsapp: { Icon: WhatsAppIcon, label: "WhatsApp", bg: "bg-green-50", text: "text-green-700" },
  zoom: { Icon: ZoomIcon, label: "Zoom", bg: "bg-blue-50", text: "text-blue-700" },
  fireflies: { Icon: FirefliesIcon, label: "Fireflies", bg: "bg-violet-50", text: "text-violet-700" },
  hubspot: { Icon: HubSpotIcon, label: "HubSpot", bg: "bg-orange-50", text: "text-orange-700" },
}

export function generateStaticParams() {
  return demoSignals.map((s) => ({ id: s.id }))
}

export default function InsightPage({ params }: { params: { id: string } }) {
  const signal = demoSignals.find((s) => s.id === params.id)
  if (!signal) notFound()

  const cfg = priorityConfig[signal.priority]
  const idx = demoSignals.findIndex((s) => s.id === params.id)
  const nextSignal = demoSignals[idx + 1] ?? null
  const prevSignal = demoSignals[idx - 1] ?? null
  const isCreated = signal.ticketStatus === "created"

  return (
    <DemoLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
          <Link href="/demo/brief" className="hover:text-neutral-700 transition-colors">Brief</Link>
          <span>›</span>
          <span className="text-neutral-600 font-medium">{signal.title}</span>
          <span className="ml-auto flex gap-2">
            {prevSignal && <Link href={`/demo/insight/${prevSignal.id}`} className="hover:text-neutral-700 transition-colors">← Prev</Link>}
            {nextSignal && <Link href={`/demo/insight/${nextSignal.id}`} className="hover:text-neutral-700 transition-colors">Next →</Link>}
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Left column — signal details */}
          <div className="space-y-5">
            {/* Header card */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 border rounded-full ${cfg.badge}`}>{cfg.label}</span>
                    <span className="text-xs text-neutral-400 border border-neutral-100 bg-neutral-50 px-2.5 py-0.5 rounded-full">{signal.category}</span>
                    <div className="flex items-center gap-1">
                      {signal.sources.map((src) => {
                        const s = sourceConfig[src]
                        return s ? <s.Icon key={src} size={16} /> : null
                      })}
                    </div>
                  </div>
                  <h1 className="text-xl font-semibold text-neutral-900">{signal.title}</h1>
                  <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{signal.headline}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-2xl font-semibold text-neutral-900">{signal.mentions}</p>
                  <p className="text-xs text-neutral-400">mentions</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{signal.trend}</p>
                </div>
              </div>
            </div>

            {/* The gap */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-neutral-100">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">The gap Nectic found</p>
              </div>
              <div className="grid sm:grid-cols-2">
                <div className="p-5 border-r border-neutral-100">
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">What sales reported</p>
                  <p className="text-sm text-neutral-600 italic leading-relaxed">&ldquo;{signal.salesSummary}&rdquo;</p>
                  <p className="mt-3 text-[11px] text-neutral-300">— Sprint planning notes</p>
                </div>
                <div className="p-5 bg-neutral-900">
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">What customers actually said</p>
                  <p className="text-sm text-white italic leading-relaxed">&ldquo;{signal.quotes[0].translated}&rdquo;</p>
                  <p className="mt-3 text-[11px] text-neutral-500">— {signal.quotes[0].sender}</p>
                </div>
              </div>
            </div>

            {/* Source conversations */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Source conversations</p>
                <span className="text-xs text-neutral-400">{signal.quotes.length} of {signal.mentions} shown</span>
              </div>
              <div className="divide-y divide-neutral-100">
                {signal.quotes.map((quote) => {
                  const src = sourceConfig[quote.source]
                  return (
                    <div key={quote.id} className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        {src && (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded ${src.bg} ${src.text}`}>
                            <src.Icon size={13} />
                            {src.label}
                          </span>
                        )}
                        <span className="text-xs text-neutral-600 font-medium">{quote.sender}</span>
                        <span className="text-xs text-neutral-400 ml-auto">{quote.date}</span>
                      </div>
                      <div className="bg-neutral-50 rounded-lg px-4 py-3 text-sm text-neutral-500 leading-relaxed border border-neutral-100">
                        {quote.raw}
                      </div>
                      <div className="mt-2.5 flex gap-2">
                        <span className="text-xs text-neutral-400 flex-shrink-0">EN:</span>
                        <p className="text-sm text-neutral-700 italic leading-relaxed">&ldquo;{quote.translated}&rdquo;</p>
                      </div>
                    </div>
                  )
                })}
                {signal.mentions > signal.quotes.length && (
                  <div className="p-5 text-center bg-neutral-50">
                    <p className="text-sm text-neutral-400">+{signal.mentions - signal.quotes.length} more conversations</p>
                    <Link href="/#early-access" className="text-xs text-neutral-500 hover:text-neutral-800 underline mt-1 inline-block">
                      Connect your sources to see all →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Competitors */}
            {signal.competitors.length > 0 && (
              <div className="bg-white border border-neutral-200 rounded-lg p-5">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Competitors mentioned in context</p>
                <div className="flex gap-2 flex-wrap">
                  {signal.competitors.map((c) => (
                    <span key={c} className="text-xs text-neutral-700 border border-neutral-200 bg-neutral-50 px-3 py-1.5 rounded-full font-medium">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — ticket + resolution */}
          <div className="space-y-5">
            {/* Suggested ticket */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <JiraIcon size={16} />
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Suggested ticket</p>
                </div>
                {isCreated && (
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                    ✓ {signal.ticketId}
                  </span>
                )}
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900 leading-snug">{signal.suggestedTicket.title}</p>
                    <span className="text-xs font-mono text-neutral-500 border border-neutral-200 px-1.5 py-0.5 flex-shrink-0">{signal.suggestedTicket.priority}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-400">Estimate: {signal.suggestedTicket.estimate}</p>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">{signal.suggestedTicket.description}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {signal.suggestedTicket.labels.map((l) => (
                    <span key={l} className="text-[11px] font-mono text-neutral-500 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">{l}</span>
                  ))}
                </div>
                {!isCreated && (
                  <Link href="/#early-access" className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded hover:bg-neutral-700 transition-colors">
                    <JiraIcon size={14} />
                    Create in Jira
                  </Link>
                )}
              </div>
            </div>

            {/* Resolution timeline */}
            {isCreated && (
              <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-neutral-100">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Resolution tracking</p>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    {[
                      { date: "Feb 21", event: "Signal found in 18 conversations", done: true, icon: "🔍" },
                      { date: "Feb 21", event: `${signal.ticketId} created in Jira by PM`, done: true, icon: "📋" },
                      { date: "Mar 3", event: "Sprint started — assigned to Eng", done: true, icon: "⚡" },
                      { date: "Mar 17", event: "Shipping to production", done: false, icon: "🚀" },
                      { date: "Mar 24", event: "Nectic re-scans: did complaints drop?", done: false, icon: "📊" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm ${
                          item.done ? "bg-neutral-900 border-neutral-900" : "bg-white border-neutral-200"
                        }`}>
                          {item.done ? <span className="text-white text-[10px] font-bold">✓</span> : <span className="text-[11px]">{item.icon}</span>}
                        </div>
                        <div className="flex-1 pb-3 border-b border-neutral-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${item.done ? "text-neutral-700 font-medium" : "text-neutral-400"}`}>{item.event}</span>
                          </div>
                          <span className="text-[11px] text-neutral-400 mt-0.5 block">{item.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Get access CTA */}
            <div className="bg-neutral-900 rounded-lg p-5 text-center">
              <p className="text-sm font-semibold text-white">See this for your own signals</p>
              <p className="mt-1 text-xs text-neutral-400">First 10 teams: white-glove setup + 3 months free</p>
              <Link href="/#early-access" className="mt-4 w-full flex items-center justify-center bg-white text-neutral-900 text-xs font-semibold px-4 py-2.5 rounded hover:bg-neutral-100 transition-colors">
                Request early access →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DemoLayout>
  )
}
