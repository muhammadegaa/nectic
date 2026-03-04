import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { demoConversations, demoSignals } from "@/lib/demo-data"

const sourceConfig: Record<string, { label: string; color: string; dot: string }> = {
  whatsapp: { label: "WhatsApp", color: "bg-green-50 text-green-700 border-green-100", dot: "bg-green-500" },
  zoom: { label: "Zoom", color: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  hubspot: { label: "HubSpot", color: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-500" },
}

export default function ConversationsPage() {
  const sourceCounts = {
    whatsapp: demoConversations.filter((c) => c.source === "whatsapp").length,
    zoom: demoConversations.filter((c) => c.source === "zoom").length,
    hubspot: demoConversations.filter((c) => c.source === "hubspot").length,
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-neutral-100 px-6 py-4 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/demo/connect" className="text-neutral-400 hover:text-neutral-700 text-sm transition-colors">
              ← Connect
            </Link>
            <div className="w-px h-4 bg-neutral-200" />
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon size={20} />
              <span className="text-sm font-medium text-neutral-900">Nectic</span>
            </Link>
          </div>
          <Link
            href="/demo/brief"
            className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            Next: signals brief →
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="pb-8 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-neutral-300">02</span>
            <span className="text-xs text-neutral-400">Conversations ingested</span>
          </div>
          <h1 className="text-2xl font-light text-neutral-900 tracking-tight">
            Conversation feed
          </h1>
          <p className="mt-2 text-sm text-neutral-500 max-w-xl">
            Every message, transcript, and CRM note ingested this week — across all connected sources.
            Nectic reads these so your sales team doesn&apos;t have to change how they work.
          </p>

          {/* Source breakdown */}
          <div className="mt-6 flex gap-4 flex-wrap">
            {Object.entries(sourceCounts).map(([source, count]) => {
              const cfg = sourceConfig[source]
              return (
                <div key={source} className={`flex items-center gap-2 text-xs px-3 py-1.5 border ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className="font-medium">{cfg.label}</span>
                  <span className="text-neutral-500">{count} this week</span>
                </div>
              )
            })}
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 border border-neutral-200 bg-neutral-50 text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
              <span className="font-medium">+39 more</span>
              <span>not shown</span>
            </div>
          </div>
        </div>

        {/* Conversation list */}
        <div className="mt-6 space-y-3">
          {demoConversations.map((conv) => {
            const cfg = sourceConfig[conv.source]
            const relatedSignals = conv.signals
              .map((sid) => demoSignals.find((s) => s.id === sid))
              .filter(Boolean)

            return (
              <div key={conv.id} className="border border-neutral-100 hover:border-neutral-200 transition-colors">
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className={`mt-0.5 flex-shrink-0 text-xs px-2 py-0.5 border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-sm font-medium text-neutral-800">{conv.sender}</span>
                          <span className="text-xs text-neutral-400">{conv.company}</span>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 truncate">{conv.preview}</p>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 flex-shrink-0">{conv.date}</span>
                  </div>

                  {/* Expanded content */}
                  <div className="mt-4 pt-4 border-t border-neutral-50">
                    <p className="text-sm text-neutral-600 leading-relaxed">{conv.full}</p>
                  </div>

                  {/* Extracted signals */}
                  {relatedSignals.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-neutral-50 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-neutral-400">Signal extracted:</span>
                      {relatedSignals.map((signal) => {
                        if (!signal) return null
                        const priorityColor =
                          signal.priority === "critical"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : signal.priority === "medium"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                            : "bg-neutral-50 text-neutral-500 border-neutral-200"
                        return (
                          <Link
                            key={signal.id}
                            href={`/demo/insight/${signal.id}`}
                            className={`text-xs px-2 py-0.5 border ${priorityColor} hover:opacity-70 transition-opacity`}
                          >
                            {signal.title} →
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 flex gap-3">
          <Link
            href="/demo/brief"
            className="inline-flex items-center justify-center bg-neutral-900 text-white text-sm font-medium px-6 py-3 hover:bg-neutral-700 transition-colors"
          >
            See extracted signals →
          </Link>
          <Link
            href="/demo/connect"
            className="inline-flex items-center justify-center text-sm text-neutral-500 px-6 py-3 hover:text-neutral-900 transition-colors"
          >
            ← Back to integrations
          </Link>
        </div>
      </main>
    </div>
  )
}
