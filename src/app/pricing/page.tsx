"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { useAuth } from "@/contexts/auth-context"

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, annual: 0 },
    accounts: 3,
    features: [
      "3 accounts",
      "Full signal extraction",
      "PM agent chat",
      "Feature brief generation",
      "Signal board",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: { monthly: 79, annual: 63 },
    accounts: 15,
    features: [
      "15 accounts",
      "Everything in Free",
      "Workspace context injection",
      "Contact book (persistent roles)",
      "Re-analysis with delta tracking",
      "Shareable read-only links",
    ],
    cta: "Start 14-day trial",
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: { monthly: 199, annual: 159 },
    accounts: 50,
    features: [
      "50 accounts",
      "Everything in Starter",
      "Priority signal extraction",
      "Signal export to CSV",
      "Early access to new features",
    ],
    cta: "Start 14-day trial",
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 499, annual: 399 },
    accounts: -1,
    features: [
      "Unlimited accounts",
      "Everything in Growth",
      "BSP integration (Qiscus/Wati) — Q2 2026",
      "Multi-user workspace",
      "Priority support",
      "Custom onboarding",
    ],
    cta: "Start 14-day trial",
    highlight: false,
  },
]

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  async function handleSelect(planId: string) {
    if (planId === "free") {
      router.push(user ? "/concept" : "/auth/signup")
      return
    }

    if (!user) {
      router.push(`/auth/signup?redirect=/pricing&plan=${planId}`)
      return
    }

    setLoading(planId)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          billing,
          userId: user.uid,
          email: user.email ?? "",
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Checkout failed")
      }

      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err) {
      console.error(err)
      alert("Could not start checkout. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon size={24} />
          <span className="font-semibold text-sm tracking-tight">Nectic</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/concept" className="text-sm text-white/60 hover:text-white transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/auth/signup" className="text-sm bg-white text-black px-3 py-1.5 rounded-md font-medium hover:bg-white/90 transition-colors">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Pricing that scales with your accounts
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Per-account pricing. No per-seat tax. All plans include a 14-day free trial.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 mt-8 p-1 bg-white/6 rounded-lg border border-white/8">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-2 text-sm rounded-md transition-all ${
                billing === "monthly"
                  ? "bg-white text-black font-medium"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-4 py-2 text-sm rounded-md transition-all flex items-center gap-2 ${
                billing === "annual"
                  ? "bg-white text-black font-medium"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Annual
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                billing === "annual" ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-500/10 text-emerald-500"
              }`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border p-6 flex flex-col gap-6 ${
                plan.highlight
                  ? "border-white/30 bg-white/6"
                  : "border-white/8 bg-white/3"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-white text-black text-xs font-semibold px-3 py-1 rounded-full">
                    Most popular
                  </span>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-white/60 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {plan.price[billing] === 0 ? "Free" : `$${plan.price[billing]}`}
                  </span>
                  {plan.price[billing] > 0 && (
                    <span className="text-white/40 text-sm">/month</span>
                  )}
                </div>
                {billing === "annual" && plan.price.monthly > 0 && (
                  <p className="text-xs text-white/30 mt-1 line-through">${plan.price.monthly}/mo billed monthly</p>
                )}
                <p className="text-sm text-white/40 mt-2">
                  {plan.accounts === -1 ? "Unlimited accounts" : `Up to ${plan.accounts} accounts`}
                </p>
              </div>

              <ul className="flex flex-col gap-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                    <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                  plan.highlight
                    ? "bg-white text-black hover:bg-white/90"
                    : "border border-white/15 text-white hover:bg-white/8"
                }`}
              >
                {loading === plan.id ? "Loading..." : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* ROI anchor */}
        <div className="mt-16 rounded-xl border border-white/8 bg-white/3 p-8 text-center">
          <p className="text-white/40 text-sm mb-2">Why this is not a cost — it's insurance</p>
          <p className="text-xl font-semibold mb-1">
            At 5% monthly churn on 200 accounts with $10K ACV
          </p>
          <p className="text-white/60">
            One month of missed early signals = <span className="text-white font-medium">$40K in preventable churn.</span>{" "}
            Nectic at $200/month is{" "}
            <span className="text-emerald-400 font-medium">200x ROI on recovered accounts alone.</span>
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          {[
            {
              q: "What counts as an account?",
              a: "Each WhatsApp group chat you upload is one account. One customer = one account, regardless of how many contacts are in the group.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel before your next billing date and you won't be charged. Annual plans are non-refundable but can be cancelled to stop renewal.",
            },
            {
              q: "Is my data safe?",
              a: "Conversation text is processed only for signal extraction and never stored beyond 90 days. You can delete your data at any time from Settings.",
            },
            {
              q: "Do you support Bahasa Indonesia?",
              a: "Yes. Nectic is built specifically for SEA markets. Signal extraction works on Bahasa Indonesia, English, and code-switched conversations.",
            },
            {
              q: "What is BSP integration?",
              a: "In Q2 2026, Pro users will be able to connect via a WhatsApp Business Solution Provider (Qiscus/Wati) for automated ingestion — no more manual exports.",
            },
            {
              q: "Is there a free trial?",
              a: "Yes — 14 days on all paid plans, no credit card required. The Free plan is always free with 3 accounts.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="font-medium text-sm mb-2">{q}</p>
              <p className="text-white/50 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
