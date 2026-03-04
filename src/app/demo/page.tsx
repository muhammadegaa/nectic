import Link from "next/link"
import Image from "next/image"
import { demoWeek } from "@/lib/demo-data"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-neutral-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-nectic-icon.png" alt="Nectic" width={24} height={24} className="rounded" />
            <span className="text-sm font-medium text-neutral-900">Nectic</span>
          </Link>
          <span className="text-xs text-neutral-400 bg-neutral-50 border border-neutral-200 px-3 py-1 rounded-full">
            Interactive demo
          </span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Demo</p>
          <h1 className="mt-4 text-4xl font-light text-neutral-900 leading-tight tracking-tight">
            This is what your PM would see<br />
            <span className="text-neutral-400">every Monday morning.</span>
          </h1>
          <p className="mt-6 text-base text-neutral-500 leading-relaxed">
            Nectic analyzed 47 sales conversations from the week of {demoWeek.period} for{" "}
            <span className="text-neutral-700 font-medium">{demoWeek.company}</span> — a B2B HR SaaS team in Indonesia.
            It found 12 product signals, ranked them by business impact, and wrote the brief below.
          </p>
          <p className="mt-3 text-base text-neutral-500 leading-relaxed">
            No one on the sales team did anything differently. No one filled out a form.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 py-8 border-t border-b border-neutral-100">
            <div>
              <p className="text-3xl font-light text-neutral-900">{demoWeek.stats.conversations}</p>
              <p className="mt-1 text-xs text-neutral-400">conversations read</p>
            </div>
            <div>
              <p className="text-3xl font-light text-neutral-900">{demoWeek.stats.signals}</p>
              <p className="mt-1 text-xs text-neutral-400">signals found</p>
            </div>
            <div>
              <p className="text-3xl font-light text-red-500">{demoWeek.stats.critical}</p>
              <p className="mt-1 text-xs text-neutral-400">critical this week</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/demo/brief"
              className="inline-flex items-center justify-center bg-neutral-900 text-white text-sm font-medium px-6 py-3 hover:bg-neutral-700 transition-colors"
            >
              View this week&apos;s brief →
            </Link>
            <Link
              href="/#early-access"
              className="inline-flex items-center justify-center text-sm text-neutral-500 px-6 py-3 hover:text-neutral-900 border border-neutral-200 transition-colors"
            >
              Get early access
            </Link>
          </div>

          <p className="mt-6 text-xs text-neutral-400">
            All conversations are simulated. No real customer data is used in this demo.
          </p>
        </div>
      </main>
    </div>
  )
}
