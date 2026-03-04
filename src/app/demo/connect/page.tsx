import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { demoIntegrations } from "@/lib/demo-data"

const categoryOrder = ["Conversation", "CRM", "Output"]

export default function ConnectPage() {
  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    items: demoIntegrations.filter((i) => i.category === cat),
  }))

  const categoryLabels: Record<string, string> = {
    Conversation: "Conversation sources — where customer truth lives",
    CRM: "CRM — deal context and notes",
    Output: "Outputs — where intelligence lands",
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-neutral-100 px-6 py-4 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-neutral-400 hover:text-neutral-700 text-sm transition-colors">
              ← Pipeline
            </Link>
            <div className="w-px h-4 bg-neutral-200" />
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon size={20} />
              <span className="text-sm font-medium text-neutral-900">Nectic</span>
            </Link>
          </div>
          <Link
            href="/demo/conversations"
            className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            Next: conversations →
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="pb-8 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-neutral-300">01</span>
            <span className="text-xs text-neutral-400">Connect sources</span>
          </div>
          <h1 className="text-2xl font-light text-neutral-900 tracking-tight">Integrations</h1>
          <p className="mt-2 text-sm text-neutral-500 max-w-xl">
            Nectic connects to wherever your sales conversations actually happen — not just one channel.
            Each source feeds the same intelligence pipeline.
          </p>
        </div>

        <div className="mt-8 space-y-10">
          {grouped.map(({ category, items }) => (
            <div key={category}>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
                {categoryLabels[category]}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((integration) => (
                  <IntegrationCard key={integration.id} integration={integration} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Data flow explanation */}
        <div className="mt-14 border-t border-neutral-100 pt-10">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-6">
            How data flows
          </p>
          <div className="grid sm:grid-cols-3 gap-px bg-neutral-100">
            {[
              {
                step: "Read-only access",
                detail:
                  "Nectic never sends messages or modifies data. It only reads — your sales team's workflow stays unchanged.",
              },
              {
                step: "Anonymised storage",
                detail:
                  "Sender names are replaced with role + company labels before storage. Raw PII is never retained.",
              },
              {
                step: "Your data, always",
                detail:
                  "All extracted signals are stored in your own Firestore instance. Delete anytime. No training on your data.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white px-5 py-5">
                <p className="text-sm font-medium text-neutral-700">{item.step}</p>
                <p className="mt-2 text-xs text-neutral-500 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex gap-3">
          <Link
            href="/demo/conversations"
            className="inline-flex items-center justify-center bg-neutral-900 text-white text-sm font-medium px-6 py-3 hover:bg-neutral-700 transition-colors"
          >
            See ingested conversations →
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center text-sm text-neutral-500 px-6 py-3 hover:text-neutral-900 transition-colors"
          >
            ← Back to pipeline
          </Link>
        </div>
      </main>
    </div>
  )
}

function IntegrationCard({ integration }: { integration: (typeof demoIntegrations)[0] }) {
  const isConnected = integration.status === "connected"

  return (
    <div className={`border p-5 ${integration.color} ${isConnected ? "" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xl">{integration.icon}</span>
          <div>
            <p className="text-sm font-medium text-neutral-900">{integration.name}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{integration.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${integration.dot}`} />
          <span className="text-xs text-neutral-500">
            {isConnected ? "Connected" : "Available"}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/60 flex items-center justify-between">
        <span className="text-xs text-neutral-600 font-medium">{integration.stats.value}</span>
        <span className="text-xs text-neutral-400">{integration.stats.label}</span>
      </div>

      {integration.setupSteps.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-neutral-400 mb-2">Setup ({integration.setupSteps.length} steps)</p>
          <ol className="space-y-1">
            {integration.setupSteps.map((step, i) => (
              <li key={i} className="text-xs text-neutral-500 flex gap-2">
                <span className="text-neutral-300 flex-shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
