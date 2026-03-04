"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import LogoIcon from "@/components/logo-icon"

const steps = [
  { number: "01", label: "Connect", href: "/demo/connect", shortLabel: "Connect" },
  { number: "02", label: "Conversations", href: "/demo/conversations", shortLabel: "Ingest" },
  { number: "03", label: "Brief", href: "/demo/brief", shortLabel: "Brief" },
  { number: "04", label: "Signal detail", href: "/demo/insight/payroll-sync-gap", shortLabel: "Signal" },
]

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const currentIndex = steps.findIndex(
    (s) => pathname === s.href || (s.href.includes("/insight/") && pathname.includes("/insight/"))
  )

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="bg-white border-b border-neutral-200 px-4 sm:px-6 h-12 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <LogoIcon size={20} />
            <span className="text-sm font-semibold text-neutral-900">Nectic</span>
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href="/demo" className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
            Demo
          </Link>
          {currentIndex >= 0 && (
            <>
              <span className="text-neutral-300">/</span>
              <span className="text-sm text-neutral-700 font-medium">{steps[currentIndex].label}</span>
            </>
          )}
        </div>

        {/* Step progress pills */}
        <div className="hidden sm:flex items-center gap-1">
          {steps.map((step, i) => {
            const isActive =
              pathname === step.href ||
              (step.href.includes("/insight/") && pathname.includes("/insight/"))
            const isDone = currentIndex > i

            return (
              <Link
                key={step.href}
                href={step.href}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-neutral-900 text-white"
                    : isDone
                    ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : isDone ? "bg-neutral-500" : "bg-neutral-300"}`} />
                {step.shortLabel}
              </Link>
            )
          })}
        </div>

        <Link
          href="/#early-access"
          className="text-xs font-medium text-white bg-neutral-900 px-3 py-1.5 hover:bg-neutral-700 transition-colors rounded"
        >
          Get access
        </Link>
      </header>

      {children}
    </div>
  )
}
