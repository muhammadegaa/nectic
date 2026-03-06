"use client"

const steps = [
  {
    number: "01",
    title: "Connect",
    description:
      "Upload a WhatsApp .txt export or connect your WATI Business API. Nectic parses the conversation in under 60 seconds. No IT ticket, no migration.",
    detail: "Works with any WhatsApp group — customer onboarding, support, renewal, and everything in between.",
  },
  {
    number: "02",
    title: "Detect",
    description:
      "AI surfaces churn signals with exact customer quotes — competitor mentions, sentiment drops, unresolved complaints, renewal risk. In Bahasa Indonesia and English.",
    detail: "Every signal links to the message that triggered it. No black-box scores — you see exactly what the customer said.",
  },
  {
    number: "03",
    title: "Act",
    description:
      "Get your Monday briefing with accounts that changed, competitor mentions, and AI-drafted WhatsApp responses ready to send. Close the loop before it's too late.",
    detail: "Signal detected → draft response generated → copy and send. The whole loop in under 2 minutes.",
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 lg:px-8 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
            How it works
          </p>
          <h2 className="text-3xl font-light text-neutral-900 leading-tight">
            From WhatsApp conversation<br />
            <span className="text-neutral-400">to action queue in minutes.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-neutral-200">
          {steps.map((step) => (
            <div key={step.number} className="bg-neutral-50 p-8 flex flex-col">
              <span className="text-xs font-mono text-neutral-300 mb-4">{step.number}</span>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">{step.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed mb-4">{step.description}</p>
              <p className="text-xs text-neutral-400 leading-relaxed mt-auto pt-4 border-t border-neutral-200">{step.detail}</p>
            </div>
          ))}
        </div>

        {/* Proof points */}
        <div className="mt-16 grid sm:grid-cols-2 gap-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">What you get</p>
            <ul className="space-y-2.5 text-sm text-neutral-600">
              {[
                "Health score (1–10) per account, updated on every re-analysis",
                "Risk signals with exact customer quotes and suggested next steps",
                "Competitor mention alerts with AI-drafted retention responses",
                "Weekly digest email — Monday, before your standup",
                "Account-grouped action queue so nothing falls through",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 shrink-0 text-emerald-500" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <polyline points="2 8 6 12 14 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-neutral-900 rounded-xl p-6">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Built for SEA</p>
            <ul className="space-y-2.5 text-sm text-neutral-300">
              {[
                "Bahasa Indonesia signal detection — reads indirect language accurately",
                "Code-switching support (BI ↔ EN) in the same conversation",
                "WhatsApp-first architecture — no email or CRM required",
                "Works with group chats where multiple CS reps and customers mix",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 shrink-0 text-amber-400" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <polyline points="2 8 6 12 14 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
