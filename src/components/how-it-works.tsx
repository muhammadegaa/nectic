"use client"

const steps = [
  {
    number: "01",
    title: "Connect",
    description:
      "Share your WhatsApp Business number. Nectic connects via the official API. Takes under 2 minutes. No data migration, no IT ticket.",
  },
  {
    number: "02",
    title: "Monitor",
    description:
      "Nectic reads every customer conversation your sales team has. Silently. Automatically. No one needs to summarize or tag anything.",
  },
  {
    number: "03",
    title: "Brief",
    description:
      "Every Monday, your PM gets a brief. What customers said, clustered by theme, ranked by frequency. With the exact quotes to back it up.",
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 lg:px-8 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-12">
          How it works
        </p>

        <div className="grid md:grid-cols-3 gap-px bg-neutral-200">
          {steps.map((step) => (
            <div key={step.number} className="bg-neutral-50 p-8">
              <span className="text-xs font-mono text-neutral-300">{step.number}</span>
              <h3 className="text-lg font-medium text-neutral-900 mt-4 mb-3">{step.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
