"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import LogoIcon from "@/components/logo-icon"
import { useAuth } from "@/contexts/auth-context"
import {
  saveWorkspace,
  markOnboardingComplete,
  isOnboardingComplete,
  type WorkspaceContext,
} from "@/lib/concept-firestore"

type AutofillPhase = "idle" | "loading" | "review" | "error"

interface AutofillState {
  phase: AutofillPhase
  productDescription?: string
  featureAreas?: string
  source?: string
  message?: string
}

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [checking, setChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)

  const [productDescription, setProductDescription] = useState("")
  const [featureAreas, setFeatureAreas] = useState("")
  const [roadmapFocus, setRoadmapFocus] = useState("")
  const [knownIssues, setKnownIssues] = useState("")
  const [notificationEmail, setNotificationEmail] = useState("")

  const [autofillUrl, setAutofillUrl] = useState("")
  const [autofill, setAutofill] = useState<AutofillState>({ phase: "idle" })

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace("/concept/login"); return }
    // If already onboarded, skip to dashboard
    isOnboardingComplete(user.uid).then((done) => {
      if (done) router.replace("/concept")
      else setChecking(false)
    })
  }, [user, authLoading, router])

  const handleAutofill = async () => {
    const url = autofillUrl.trim()
    if (!url) return
    setAutofill({ phase: "loading" })
    try {
      const res = await fetch("/api/workspace/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok || !data.productDescription) throw new Error(data.error ?? "Could not extract product details")
      setAutofill({
        phase: "review",
        productDescription: data.productDescription,
        featureAreas: data.featureAreas ?? "",
        source: data.source ?? url,
      })
    } catch (err) {
      setAutofill({ phase: "error", message: err instanceof Error ? err.message : "Failed to fetch" })
    }
  }

  const applyAutofill = () => {
    if (autofill.phase !== "review") return
    setProductDescription(autofill.productDescription ?? "")
    setFeatureAreas(autofill.featureAreas ?? "")
    setAutofill({ phase: "idle" })
    setAutofillUrl("")
  }

  const handleStep1Next = () => {
    setStep(2)
  }

  const handleComplete = async (skip = false) => {
    if (!user) return
    setSaving(true)
    try {
      const ctx: WorkspaceContext = {}
      if (!skip) {
        if (productDescription.trim()) ctx.productDescription = productDescription.trim()
        if (featureAreas.trim()) ctx.featureAreas = featureAreas.trim()
        if (roadmapFocus.trim()) ctx.roadmapFocus = roadmapFocus.trim()
        if (knownIssues.trim()) ctx.knownIssues = knownIssues.trim()
      }
      if (notificationEmail.trim()) ctx.notificationEmail = notificationEmail.trim()
      if (Object.keys(ctx).length > 0) await saveWorkspace(user.uid, ctx)
      await markOnboardingComplete(user.uid)
      router.replace("/concept")
    } finally {
      setSaving(false)
    }
  }

  const filledCount = [productDescription, featureAreas, roadmapFocus, knownIssues].filter(v => v.trim()).length

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
        <LogoIcon size={24} />
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1].map((i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i < step ? "w-6 bg-neutral-900" : "w-6 bg-neutral-200"}`} />
            ))}
          </div>
          <span className="text-xs text-neutral-400 ml-1">Step {step} of 2</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 pb-24">
        {step === 2 ? null : (
        <div className="mb-8">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Workspace setup</p>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Tell Nectic about your product</h1>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
            This context is injected into every analysis. The more specific you are, the sharper the signal detection.
            You can update this anytime in Workspace settings.
          </p>
        </div>
        )}

        {/* Step 1 content */}
        {step === 1 && (<>

        {/* Autofill from URL */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-neutral-700 mb-1">Quick setup — auto-fill from your website</p>
          <p className="text-xs text-neutral-400 mb-3">Paste your product or landing page URL and we&apos;ll extract product description and feature areas.</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={autofillUrl}
              onChange={(e) => setAutofillUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAutofill() }}
              placeholder="https://yourproduct.com"
              className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-white"
            />
            <button
              onClick={handleAutofill}
              disabled={!autofillUrl.trim() || autofill.phase === "loading"}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {autofill.phase === "loading" ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              )}
              Auto-fill
            </button>
          </div>

          {autofill.phase === "review" && (
            <div className="mt-4 border border-neutral-200 rounded-lg overflow-hidden">
              <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between">
                <p className="text-xs font-semibold text-neutral-700">AI-extracted from {autofill.source}</p>
                <button onClick={() => setAutofill({ phase: "idle" })} className="text-xs text-neutral-400 hover:text-neutral-700">Discard</button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-1">Product description</p>
                  <p className="text-sm text-neutral-700 leading-relaxed">{autofill.productDescription}</p>
                </div>
                {autofill.featureAreas && (
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-1">Feature areas</p>
                    <p className="text-sm text-neutral-700">{autofill.featureAreas}</p>
                  </div>
                )}
              </div>
              <div className="px-4 pb-4">
                <button
                  onClick={applyAutofill}
                  className="w-full py-2 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Apply these details
                </button>
              </div>
            </div>
          )}

          {autofill.phase === "error" && (
            <p className="mt-3 text-xs text-red-600">{autofill.message} — you can fill in the fields manually below.</p>
          )}
        </div>

        {/* Manual fields */}
        <div className="space-y-4">
          <WorkspaceField
            label="What your product does"
            hint="Who it serves, what problem it solves. 2–3 sentences."
            placeholder="e.g. We build an HR SaaS for SMEs in Indonesia — payroll, attendance, and leave management for companies with 20–500 employees."
            value={productDescription}
            onChange={setProductDescription}
            rows={4}
          />
          <WorkspaceField
            label="Feature areas"
            hint="Your product's core modules. Comma-separated."
            placeholder="e.g. Payroll processing, attendance tracking, leave management, reimbursement, approval workflows"
            value={featureAreas}
            onChange={setFeatureAreas}
            rows={2}
          />
          <WorkspaceField
            label="Roadmap this quarter"
            hint="What's being built or shipped right now."
            placeholder="e.g. Mobile app, bulk payroll import, BPJS integration"
            value={roadmapFocus}
            onChange={setRoadmapFocus}
            rows={2}
          />
          <WorkspaceField
            label="Known issues"
            hint="Bugs your team already knows about — Nectic won't surface these as new findings."
            placeholder="e.g. Reports slow for 200+ employee accounts. Push notifications unreliable on Android 13."
            value={knownIssues}
            onChange={setKnownIssues}
            rows={2}
          />
        </div>

        {/* Calibration bar */}
        {filledCount > 0 && (
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                style={{ width: `${(filledCount / 4) * 100}%` }}
              />
            </div>
            <span className="text-xs text-neutral-400 tabular-nums">{filledCount}/4 fields</span>
          </div>
        )}

        {/* End step 1 wrapper */}
        </>)}

        {/* Actions */}
        {step === 1 ? (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => handleStep1Next()}
              className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleStep1Next}
              disabled={filledCount === 0}
              className="flex items-center gap-2 bg-neutral-900 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        ) : (
          // Step 2 is rendered in a separate section below
          null
        )}

        {/* Step 2 — notifications */}
        {step === 2 && (
          <div className="mt-0">
            <div className="mb-8">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Almost there</p>
              <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Where should we send your weekly digest?</h1>
              <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
                Nectic emails you every Monday with your portfolio health, accounts that changed, and competitor mentions — with exact customer quotes.
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-6">
              <div className="px-5 pt-4 pb-2 border-b border-neutral-100">
                <p className="text-sm font-semibold text-neutral-800">Digest &amp; alert email</p>
                <p className="text-xs text-neutral-400 mt-0.5">Weekly portfolio digest + critical risk &amp; competitor alerts</p>
              </div>
              <div className="px-5 py-4">
                <input
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                  autoFocus
                  className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-2.5 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-neutral-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => handleComplete(false)}
                disabled={saving}
                className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors disabled:opacity-40"
              >
                Skip — set up later
              </button>
              <button
                onClick={() => handleComplete(false)}
                disabled={saving}
                className="flex items-center gap-2 bg-neutral-900 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {saving ? "Saving…" : "Start using Nectic →"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function WorkspaceField({
  label,
  hint,
  placeholder,
  value,
  onChange,
  rows,
}: {
  label: string
  hint: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  rows: number
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-sm font-semibold text-neutral-800">{label}</p>
          {value.trim() && (
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          )}
        </div>
        <p className="text-xs text-neutral-400">{hint}</p>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-5 py-3 text-sm text-neutral-700 placeholder:text-neutral-300 focus:outline-none resize-none border-t border-neutral-100 bg-white"
      />
    </div>
  )
}
