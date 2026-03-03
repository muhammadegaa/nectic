"use client"

export default function SignalPreview() {
  return (
    <section className="py-24 px-6 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">
          What your PM receives every Monday
        </p>
        <p className="text-2xl font-light text-neutral-900 mb-12 max-w-lg">
          No spreadsheet. No meeting. Just signal.
        </p>

        <div className="border border-neutral-200 bg-white max-w-2xl">
          {/* Brief header */}
          <div className="border-b border-neutral-100 px-6 py-4 flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400">nectic / weekly-brief</span>
            <span className="text-xs text-neutral-400">Mon, Feb 23 · 08:00</span>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Meta */}
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-neutral-400">Conversations</p>
                <p className="text-2xl font-light text-neutral-900 mt-0.5">34</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Sales reps</p>
                <p className="text-2xl font-light text-neutral-900 mt-0.5">6</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Signals extracted</p>
                <p className="text-2xl font-light text-neutral-900 mt-0.5">19</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-100" />

            {/* Top signals */}
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-4">Top signals this week</p>
              <div className="space-y-4">
                {[
                  { rank: 1, label: "API documentation unclear", count: 8, bar: "w-full", deals: "3 enterprise deals at risk" },
                  { rank: 2, label: "No Excel export", count: 6, bar: "w-4/5", deals: null },
                  { rank: 3, label: "Shopify integration missing", count: 5, bar: "w-3/5", deals: "All SMB segment" },
                ].map((signal) => (
                  <div key={signal.rank} className="flex items-start gap-4">
                    <span className="text-xs font-mono text-neutral-300 mt-0.5 w-4 shrink-0">{signal.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-neutral-700 truncate">{signal.label}</span>
                        <span className="text-xs text-neutral-400 ml-3 shrink-0">{signal.count}×</span>
                      </div>
                      <div className="h-px bg-neutral-100 w-full">
                        <div className={`h-px bg-neutral-800 ${signal.bar}`} />
                      </div>
                      {signal.deals && (
                        <p className="text-xs text-neutral-400 mt-1">{signal.deals}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-100" />

            {/* The gap */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-50 p-4">
                <p className="text-xs text-neutral-400 mb-2">What sales said in standup</p>
                <p className="text-sm text-neutral-600 italic">"Clients want better UI."</p>
              </div>
              <div className="bg-neutral-900 p-4">
                <p className="text-xs text-neutral-400 mb-2">What customers actually said</p>
                <p className="text-sm text-white italic">"Your docs are broken and we can't integrate."</p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-neutral-400 max-w-md">
          Every signal includes the original quote, the customer name, and the deal context — so your PM can verify and act.
        </p>
      </div>
    </section>
  )
}
