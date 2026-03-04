import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { WhatsAppIcon, ZoomIcon, HubSpotIcon, JiraIcon, SlackIcon } from "@/components/brand-icons"
import { demoWeek, demoIntegrations } from "@/lib/demo-data"

const steps = [
  {
    number: "01",
    label: "Connect sources",
    description: "WhatsApp, Zoom calls, CRM notes — wherever your sales conversations happen",
    href: "/demo/connect",
    cta: "View integrations →",
    integrations: ["💬 WhatsApp", "🎥 Zoom", "🔶 HubSpot"],
  },
  {
    number: "02",
    label: "Conversations ingested",
    description: "Every message, transcript, and note is read, anonymised, and stored",
    href: "/demo/conversations",
    cta: "See conversation feed →",
    integrations: ["47 this week", "Bahasa + English", "Real-time"],
  },
  {
    number: "03",
    label: "Signals extracted",
    description: "GPT-4o clusters patterns, scores urgency, separates signal from noise",
    href: "/demo/brief",
    cta: "View this week's brief →",
    integrations: ["12 signals", "3 critical", "Ranked by impact"],
  },
  {
    number: "04",
    label: "Brief delivered",
    description: "PM gets a weekly intelligence brief — every Monday, 8 AM",
    href: "/demo/brief",
    cta: "Read the brief →",
    integrations: ["📢 Slack #product", "📧 Email", "In-app"],
  },
  {
    number: "05",
    label: "Ticket created",
    description: "One click creates a pre-written ticket in Jira or Linear with full context",
    href: "/demo/insight/payroll-sync-gap",
    cta: "See signal → ticket →",
    integrations: ["📋 Jira", "⬡ Linear", "Notion"],
  },
]

const connectedCount = demoIntegrations.filter((i) => i.status === "connected").length

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-neutral-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon size={22} />
            <span className="text-sm font-medium text-neutral-900">Nectic</span>
          </Link>
          <span className="text-xs text-neutral-400 bg-neutral-50 border border-neutral-200 px-3 py-1 rounded-full">
            Interactive demo
          </span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">
            End-to-end demo
          </p>
          <h1 className="mt-4 text-4xl font-light text-neutral-900 leading-tight tracking-tight">
            From sales conversation<br />
            <span className="text-neutral-400">to shipped feature.</span>
          </h1>
          <p className="mt-5 text-base text-neutral-500 leading-relaxed">
            Nectic is not a WhatsApp tool. It&apos;s the intelligence layer between wherever your
            customers speak truth — WhatsApp, Zoom calls, CRM notes — and the product decisions
            your PM makes. Below is the full pipeline for{" "}
            <span className="font-medium text-neutral-700">{demoWeek.company}</span>, week of{" "}
            {demoWeek.period}.
          </p>
        </div>

        {/* Stats bar */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-px bg-neutral-100 border border-neutral-100">
          {[
            { value: String(connectedCount), label: "integrations connected" },
            { value: String(demoWeek.stats.conversations), label: "conversations ingested" },
            { value: String(demoWeek.stats.signals), label: "signals extracted" },
            { value: "3", label: "tickets created" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white px-6 py-5">
              <p className="text-2xl font-light text-neutral-900">{stat.value}</p>
              <p className="mt-0.5 text-xs text-neutral-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline steps */}
        <div className="mt-16">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-8">
            The pipeline — click any step
          </p>
          <div className="space-y-px bg-neutral-100 border border-neutral-100">
            {steps.map((step, i) => (
              <Link
                key={step.number}
                href={step.href}
                className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 bg-white px-6 py-6 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex-shrink-0 w-12">
                  <span className="text-xs font-mono text-neutral-300 group-hover:text-neutral-500 transition-colors">
                    {step.number}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-neutral-900">{step.label}</p>
                  <p className="mt-1 text-sm text-neutral-500">{step.description}</p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {step.integrations.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-neutral-500 border border-neutral-100 bg-neutral-50 px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {/* Progress indicator */}
                  <div className="hidden sm:flex gap-1">
                    {steps.map((_, j) => (
                      <span
                        key={j}
                        className={`w-1 h-1 rounded-full ${j <= i ? "bg-neutral-900" : "bg-neutral-200"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-neutral-400 group-hover:text-neutral-700 transition-colors whitespace-nowrap">
                    {step.cta}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 pt-10 border-t border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Ready to connect your own conversations?
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              First 10 teams get white-glove setup + 3 months free.
            </p>
          </div>
          <Link
            href="/#early-access"
            className="flex-shrink-0 inline-flex items-center justify-center bg-neutral-900 text-white text-sm font-medium px-6 py-3 hover:bg-neutral-700 transition-colors"
          >
            Request early access →
          </Link>
        </div>
      </main>
    </div>
  )
}
