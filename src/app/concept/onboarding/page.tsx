"use client"

import { useState, useEffect, useRef } from "react"
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
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [productDescription, setProductDescription] = useState("")
  const [featureAreas, setFeatureAreas] = useState("")
  const [roadmapFocus, setRoadmapFocus] = useState("")
  const [knownIssues, setKnownIssues] = useState("")
  const [notificationEmail, setNotificationEmail] = useState("")
  const [watiEndpoint, setWatiEndpoint] = useState("")
  const [watiToken, setWatiToken] = useState("")

  const [autofillUrl, setAutofillUrl] = useState("")
  const [autofill, setAutofill] = useState<AutofillState>({ phase: "idle" })

  const [firstUploadFile, setFirstUploadFile] = useState<File | null>(null)
  const [firstUploadName, setFirstUploadName] = useState("")
  const uploadInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace("/concept/login"); return }
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

  const saveStep2Data = async () => {
    if (!user) return
    const ctx: WorkspaceContext = {}
    if (productDescription.trim()) ctx.productDescription = productDescription.trim()
    if (featureAreas.trim()) ctx.featureAreas = featureAreas.trim()
    if (roadmapFocus.trim()) ctx.roadmapFocus = roadmapFocus.trim()
    if (knownIssues.trim()) ctx.knownIssues = knownIssues.trim()
    if (notificationEmail.trim()) ctx.notificationEmail = notificationEmail.trim()
    if (watiEndpoint.trim()) ctx.watiEndpoint = watiEndpoint.trim()
    if (watiToken.trim()) ctx.watiToken = watiToken.trim()
    if (Object.keys(ctx).length > 0) await saveWorkspace(user.uid, ctx)
  }

  const handleStep2Next = async () => {
    if (!user) return
    setSaving(true)
    try {
      await saveStep2Data()
    } finally {
      setSaving(false)
    }
    setStep(3)
  }

  const handleComplete = async (skip = false) => {
    if (!user) return
    setSaving(true)
    try {
      if (!skip) {
        await saveStep2Data()
      }
      await markOnboardingComplete(user.uid)
      router.replace("/concept")
    } finally {
      setSaving(false)
    }
  }

  const handleAnalyzeAndComplete = async () => {
    if (!user) return
    setSaving(true)
    try {
      await markOnboardingComplete(user.uid)
      router.replace("/concept?openUpload=1")
    } finally {
      setSaving(false)
    }
  }

  const handleFirstUploadFile = (file: File) => {
    if (!file.name.endsWith(".txt") && !file.name.endsWith(".zip")) return
    setFirstUploadFile(file)
    setFirstUploadName(file.name)
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
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i < step ? "w-6 bg-neutral-900" : "w-6 bg-neutral-200"}`} />
            ))}
          </div>
          <span className="text-xs text-neutral-400 ml-1">Step {step} of 3</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 pb-24">
        {step === 2 || step === 3 ? null : (
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

        {/* Step 1 actions */}
        {step === 1 && (
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
        )}

        {/* Step 2 — notifications + WhatsApp send */}
        {step === 2 && (
          <div className="mt-0">
            <div className="mb-8">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Almost there</p>
              <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Connect alerts &amp; WhatsApp send</h1>
              <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
                Set up where Nectic alerts you, and optionally connect WhatsApp to send approved responses directly — no copy-pasting.
              </p>
            </div>

            {/* Email */}
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-4">
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

            {/* WATI integration */}
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-6">
              <div className="px-5 pt-4 pb-2 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <p className="text-sm font-semibold text-neutral-800">Send via WhatsApp (WATI)</p>
                    <span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">Optional</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">Approve a draft in the queue → message sent directly. No copy-pasting.</p>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3">
                <input
                  type="url"
                  value={watiEndpoint}
                  onChange={(e) => setWatiEndpoint(e.target.value)}
                  placeholder="https://live-mt-server.wati.io/your-api-endpoint"
                  className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-2.5 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-neutral-50 font-mono"
                />
                <input
                  type="password"
                  value={watiToken}
                  onChange={(e) => setWatiToken(e.target.value)}
                  placeholder="Bearer token from WATI dashboard"
                  className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-2.5 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-neutral-50 font-mono"
                />
                <p className="text-xs text-neutral-400">Find these in your WATI dashboard → API → Access Token. You can also set this later in Workspace settings.</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => handleStep2Next()}
                disabled={saving}
                className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors disabled:opacity-40"
              >
                Skip — set up later
              </button>
              <button
                onClick={() => handleStep2Next()}
                disabled={saving}
                className="flex items-center gap-2 bg-neutral-900 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {saving ? "Saving…" : "Next →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — first upload */}
        {step === 3 && (
          <div className="mt-0">
            <div className="mb-8">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Last step</p>
              <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Upload your first account</h1>
              <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
                Export a WhatsApp conversation with a customer and upload it here. Nectic will analyze it and surface signals in under 60 seconds.
              </p>
            </div>

            {/* Instructions card */}
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-5">
              <div className="px-5 pt-4 pb-2 border-b border-neutral-100">
                <p className="text-sm font-semibold text-neutral-800">How to export from WhatsApp</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                  <p className="text-sm text-neutral-700">Open WhatsApp → open the group or conversation with your customer</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                  <p className="text-sm text-neutral-700">Tap the three dots (⋮) → More → Export chat → Without media</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                  <p className="text-sm text-neutral-700">Upload the .txt or .zip file below</p>
                </div>
              </div>
            </div>

            {/* Upload zone */}
            <div
              onClick={() => uploadInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-100 p-10 text-center cursor-pointer hover:border-neutral-400 hover:bg-neutral-50 transition-all"
            >
              <input
                ref={uploadInputRef}
                type="file"
                accept=".txt,.zip,text/plain,application/zip"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFirstUploadFile(f)
                }}
              />
              {firstUploadFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                      <polyline points="2 8 6 12 14 4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">{firstUploadName}</p>
                  <p className="text-xs text-neutral-400">Click to change file</p>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center mx-auto mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                      <polyline points="16 16 12 12 8 16" />
                      <line x1="12" y1="12" x2="12" y2="21" />
                      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-neutral-700">Drop your WhatsApp export here</p>
                  <p className="mt-1 text-xs text-neutral-400">or click to browse · .txt or .zip</p>
                </>
              )}
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => handleComplete(false)}
                disabled={saving}
                className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors disabled:opacity-40"
              >
                Skip — I&apos;ll do this later
              </button>
              <button
                onClick={handleAnalyzeAndComplete}
                disabled={!firstUploadFile || saving}
                className="flex items-center gap-2 bg-neutral-900 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {saving ? "Saving…" : "Analyze account →"}
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
