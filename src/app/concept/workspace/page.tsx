"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import ConceptNav from "@/components/concept-nav"
import { useAuth } from "@/contexts/auth-context"
import { getWorkspace, saveWorkspace, type WorkspaceContext } from "@/lib/concept-firestore"
import { toast } from "sonner"
import { auth } from "@/lib/firebase"
import { useSearchParams } from "next/navigation"

const FIELDS: {
  key: keyof WorkspaceContext
  label: string
  sublabel: string
  hint: string
  placeholder: string
  rows: number
  icon: React.ReactNode
  unlocks: string
}[] = [
  {
    key: "productDescription",
    label: "What your product does",
    sublabel: "Product context",
    hint: "Who it serves, what problem it solves, the market. 2–3 sentences.",
    placeholder: "e.g. We build an HR SaaS for SMEs in Indonesia — payroll, attendance, and leave management for companies with 20–500 employees. Our customers are HR managers and finance teams who previously ran everything in spreadsheets.",
    rows: 4,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
    ),
    unlocks: "Account name inference, risk scoring, summary framing",
  },
  {
    key: "featureAreas",
    label: "Feature areas",
    sublabel: "Capability map",
    hint: "Your product's core modules. Comma-separated.",
    placeholder: "e.g. Payroll processing, attendance tracking, leave management, reimbursement, approval workflows, HR analytics",
    rows: 2,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    ),
    unlocks: "Signal categorisation, product brief generation",
  },
  {
    key: "roadmapFocus",
    label: "Roadmap this quarter",
    sublabel: "In-flight work",
    hint: "What's being built or shipped. Nectic uses this to distinguish gaps from work in progress.",
    placeholder: "e.g. Mobile app (approval + leave), bulk payroll import from Excel, BPJS integration, multi-level approval chains",
    rows: 3,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
    ),
    unlocks: "Avoids surfacing known work as new discoveries",
  },
  {
    key: "knownIssues",
    label: "Known issues",
    sublabel: "Suppression list",
    hint: "Bugs and limitations your team already knows about. Nectic won't surface these as new findings.",
    placeholder: "e.g. Reports slow for 200+ employee accounts. Overtime edge case on split shifts. Push notifications unreliable on Android 13.",
    rows: 3,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    ),
    unlocks: "Reduces noise — only surfaces net-new signals",
  },
]

type SaveStatus = "idle" | "saving" | "saved"

type AutofillState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "review"; productDescription: string; featureAreas: string; source: string }
  | { phase: "error"; message: string }

function getQuarterLabel(date: Date): string {
  const q = Math.floor(date.getMonth() / 3) + 1
  return `Q${q} ${date.getFullYear()}`
}

function isRoadmapStale(updatedAt: string | undefined): boolean {
  if (!updatedAt) return false
  const updated = new Date(updatedAt)
  const now = new Date()
  const updatedQ = Math.floor(updated.getMonth() / 3)
  const nowQ = Math.floor(now.getMonth() / 3)
  return updated.getFullYear() < now.getFullYear() || (updated.getFullYear() === now.getFullYear() && updatedQ < nowQ)
}

const TIMEZONES = [
  { value: "Asia/Jakarta", label: "WIB (UTC+7) — Jakarta" },
  { value: "Asia/Makassar", label: "WITA (UTC+8) — Makassar" },
  { value: "Asia/Jayapura", label: "WIT (UTC+9) — Jayapura" },
  { value: "Asia/Kuala_Lumpur", label: "MYT (UTC+8) — Kuala Lumpur" },
  { value: "Asia/Singapore", label: "SGT (UTC+8) — Singapore" },
  { value: "Asia/Bangkok", label: "ICT (UTC+7) — Bangkok" },
  { value: "Asia/Manila", label: "PHT (UTC+8) — Manila" },
  { value: "Asia/Ho_Chi_Minh", label: "ICT (UTC+7) — Ho Chi Minh" },
  { value: "UTC", label: "UTC" },
]

export default function WorkspacePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState<WorkspaceContext>({
    productDescription: "",
    featureAreas: "",
    roadmapFocus: "",
    knownIssues: "",
    notificationEmail: "",
    productStory: "",
    csPersonaName: "",
    communicationStyle: undefined,
    csEscalationProcess: "",
    alertThreshold: undefined,
    alertFrequency: undefined,
    alertTimezone: undefined,
    suppressedSignalTypes: undefined,
  })
  const [workspaceUpdatedAt, setWorkspaceUpdatedAt] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestForm = useRef(form)
  const [autofillUrl, setAutofillUrl] = useState("")
  const [autofill, setAutofill] = useState<AutofillState>({ phase: "idle" })

  const [wizardMode, setWizardMode] = useState<boolean>(false)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)
  const [webhookToken, setWebhookToken] = useState<string | null>(null)
  const [hubspotConnected, setHubspotConnected] = useState(false)
  const [hubspotPortalId, setHubspotPortalId] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!authLoading && !user) router.replace("/concept/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    getWorkspace(user.uid).then((ws) => {
      const loaded: WorkspaceContext = {
        productDescription: ws.productDescription ?? "",
        featureAreas: ws.featureAreas ?? "",
        roadmapFocus: ws.roadmapFocus ?? "",
        knownIssues: ws.knownIssues ?? "",
        notificationEmail: ws.notificationEmail ?? "",
        productStory: ws.productStory ?? "",
        csPersonaName: ws.csPersonaName ?? "",
        communicationStyle: ws.communicationStyle,
        csEscalationProcess: ws.csEscalationProcess ?? "",
        alertThreshold: ws.alertThreshold,
        alertFrequency: ws.alertFrequency,
        alertTimezone: ws.alertTimezone ?? "Asia/Jakarta",
        suppressedSignalTypes: ws.suppressedSignalTypes,
      }
      setForm(loaded)
      latestForm.current = loaded
      setWorkspaceUpdatedAt(ws.updatedAt)
      if (ws.webhookToken) setWebhookToken(ws.webhookToken)
      if (ws.hubspotConnected) setHubspotConnected(true)
      if (ws.hubspotPortalId) setHubspotPortalId(ws.hubspotPortalId)
      setLoading(false)

      if (!ws.productDescription && !ws.communicationStyle && typeof window !== "undefined") {
        const dismissed = localStorage.getItem("nectic_workspace_wizard_dismissed")
        if (!dismissed) setWizardMode(true)
      }
    })
  }, [user])

  // Handle OAuth callback results
  useEffect(() => {
    if (searchParams.get("hubspot_connected") === "1") {
      toast.success("HubSpot connected — risk signals will now sync automatically")
      setHubspotConnected(true)
    }
    const hsErr = searchParams.get("hubspot_error")
    if (hsErr) toast.error(`HubSpot connection failed: ${hsErr}`)
  }, [searchParams])

  const handleHubSpotConnect = async () => {
    if (!user) return
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return
      window.location.href = `/api/integrations/hubspot/connect?token=${encodeURIComponent(token)}`
    } catch {
      toast.error("Couldn't start HubSpot connection")
    }
  }

  const handleHubSpotDisconnect = async () => {
    if (!user) return
    try {
      const token = await auth.currentUser?.getIdToken()
      await fetch("/api/integrations/hubspot/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      setHubspotConnected(false)
      setHubspotPortalId(null)
      toast.success("HubSpot disconnected")
    } catch {
      toast.error("Disconnect failed — try again")
    }
  }

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
      if (!res.ok) {
        setAutofill({ phase: "error", message: data.error ?? "Auto-fill failed" })
        return
      }
      if (!data.productDescription && !data.featureAreas) {
        setAutofill({ phase: "error", message: "Couldn't extract product details. Try filling in manually." })
        return
      }
      setAutofill({ phase: "review", productDescription: data.productDescription, featureAreas: data.featureAreas, source: data.source })
    } catch {
      setAutofill({ phase: "error", message: "Network error — please try again." })
    }
  }

  const applyAutofill = () => {
    if (autofill.phase !== "review") return
    if (autofill.productDescription) handleChange("productDescription", autofill.productDescription)
    if (autofill.featureAreas) handleChange("featureAreas", autofill.featureAreas)
    setAutofill({ phase: "idle" })
    setAutofillUrl("")
  }

  const triggerSave = useCallback((nextForm: WorkspaceContext) => {
    if (!user) return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setSaveStatus("saving")
    debounceTimer.current = setTimeout(async () => {
      await saveWorkspace(user.uid, nextForm)
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }, 900)
  }, [user])

  const handleChange = (key: keyof WorkspaceContext, value: unknown) => {
    const next = { ...form, [key]: value }
    setForm(next)
    latestForm.current = next
    triggerSave(next)
  }

  const dismissWizard = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nectic_workspace_wizard_dismissed", "1")
    }
    setWizardMode(false)
  }

  const openWizard = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nectic_workspace_wizard_dismissed")
    }
    setWizardStep(1)
    setWizardMode(true)
  }

  const filledCount = FIELDS.filter((f) => (form[f.key] as string)?.trim()).length
  const completionPct = Math.round((filledCount / FIELDS.length) * 100)

  const qualityLabel =
    completionPct === 100 ? "Fully calibrated" :
    completionPct >= 75 ? "Well calibrated" :
    completionPct >= 50 ? "Partially calibrated" :
    completionPct > 0 ? "Minimally calibrated" :
    "Not calibrated"

  const qualityColor =
    completionPct === 100 ? "text-emerald-600" :
    completionPct >= 50 ? "text-amber-600" :
    "text-neutral-400"

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  // ── Wizard mode ───────────────────────────────────────────────────────────────

  if (!loading && wizardMode) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <ConceptNav
          active="workspace"
          userLabel={user.displayName ?? user.email ?? undefined}
          saveStatus={saveStatus}
          onSignOut={() => signOut()}
        />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-12">
          {/* Wizard header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1 rounded-full transition-all ${s <= wizardStep ? "w-6 bg-neutral-900" : "w-6 bg-neutral-200"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-neutral-400">Step {wizardStep} of 3</span>
            </div>
            <button
              onClick={dismissWizard}
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              Skip wizard — show all settings
            </button>
          </div>

          {/* Step 1 — Product intelligence */}
          {wizardStep === 1 && (
            <div>
              <div className="mb-6">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Step 1</p>
                <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">What Nectic needs to know about your product</h1>
                <p className="text-sm text-neutral-500 mt-1 leading-relaxed">These fields are injected into every analysis and AI draft. Fill in as much as you can.</p>
              </div>

              {/* Autofill widget */}
              {(completionPct === 0) && (
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
                      className="flex-1 text-xs border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-white"
                    />
                    <button
                      onClick={handleAutofill}
                      disabled={!autofillUrl.trim()}
                      className="text-xs font-medium px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      Auto-fill
                    </button>
                  </div>
                  {autofill.phase === "review" && (
                    <div className="mt-3 space-y-2">
                      {autofill.productDescription && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-medium text-blue-600 mb-1">Product description</p>
                          <p className="text-xs text-neutral-700 leading-relaxed">{autofill.productDescription}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <button onClick={applyAutofill} className="text-xs font-medium px-3 py-1.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors">Apply suggestions</button>
                        <button onClick={() => setAutofill({ phase: "idle" })} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">Dismiss</button>
                      </div>
                    </div>
                  )}
                  {autofill.phase === "error" && (
                    <p className="text-xs text-red-500 mt-1.5">{autofill.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {FIELDS.slice(0, 2).map((field) => {
                  const isFilled = !!(form[field.key] as string)?.trim()
                  return (
                    <div key={field.key} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isFilled ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
                          {field.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-800 leading-tight">{field.label}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{field.hint}</p>
                        </div>
                        {isFilled && (
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-emerald-500 shrink-0"><polyline points="2 8 6 12 14 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </div>
                      <div className="px-5 pt-3 pb-4">
                        <p className="text-[10px] text-neutral-400 mb-2 uppercase tracking-wide font-semibold">Unlocks: {field.unlocks}</p>
                        <textarea
                          value={(form[field.key] as string) ?? ""}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          rows={field.rows}
                          className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-3 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-neutral-50 resize-none leading-relaxed transition-colors"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-end mt-8">
                <button
                  onClick={() => setWizardStep(2)}
                  className="flex items-center gap-2 bg-neutral-900 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Communication voice */}
          {wizardStep === 2 && (
            <div>
              <div className="mb-6">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Step 2</p>
                <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">How your team communicates</h1>
                <p className="text-sm text-neutral-500 mt-1 leading-relaxed">Tell Nectic how your team writes. Every WhatsApp draft will match your voice — not a generic AI voice.</p>
              </div>

              <div className="space-y-4">
                {/* CSM persona name */}
                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${form.csPersonaName?.trim() ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 leading-tight">CSM name</p>
                      <p className="text-xs text-neutral-400 mt-0.5">First name or name + role. Drafts will be written as this person.</p>
                    </div>
                  </div>
                  <div className="px-5 pt-3 pb-4">
                    <input
                      type="text"
                      value={form.csPersonaName ?? ""}
                      onChange={(e) => handleChange("csPersonaName" as keyof WorkspaceContext, e.target.value)}
                      placeholder="e.g. Reza, Sarah CS, Dian"
                      className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-2.5 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-neutral-50 transition-colors"
                    />
                  </div>
                </div>

                {/* Communication style */}
                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${form.communicationStyle ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 leading-tight">How your team writes</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Drafts will match this register — same formality, same warmth level.</p>
                    </div>
                  </div>
                  <div className="px-5 pt-3 pb-4">
                    <div className="flex gap-2 flex-wrap">
                      {([
                        { value: "formal", label: "Formal", desc: "Full sentences, professional" },
                        { value: "warm", label: "Warm & professional", desc: "Direct but empathetic" },
                        { value: "casual", label: "Casual", desc: "Conversational, natural" },
                      ] as const).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleChange("communicationStyle" as keyof WorkspaceContext, opt.value)}
                          className={`flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-colors ${
                            form.communicationStyle === opt.value
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : "text-neutral-600 border-neutral-200 hover:border-neutral-400 bg-white"
                          }`}
                        >
                          <span className="text-xs font-semibold">{opt.label}</span>
                          <span className={`text-[10px] mt-0.5 ${form.communicationStyle === opt.value ? "text-neutral-400" : "text-neutral-400"}`}>{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Product story */}
                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${form.productStory?.trim() ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 leading-tight">One-line pitch</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Injected into every AI draft so responses sound like they come from your company.</p>
                    </div>
                  </div>
                  <div className="px-5 pt-3 pb-4">
                    <input
                      type="text"
                      value={form.productStory ?? ""}
                      onChange={(e) => handleChange("productStory" as keyof WorkspaceContext, e.target.value)}
                      placeholder="e.g. We help Indonesian HR teams automate payroll and attendance for SMEs."
                      className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-2.5 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-neutral-50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setWizardStep(1)}
                  className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  className="flex items-center gap-2 bg-neutral-900 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Alert preferences */}
          {wizardStep === 3 && (
            <div>
              <div className="mb-6">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Step 3</p>
                <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">When and how to alert you</h1>
                <p className="text-sm text-neutral-500 mt-1 leading-relaxed">Control which signals trigger notifications and how often you hear from Nectic.</p>
              </div>

              <AlertPreferencesCard form={form} handleChange={handleChange} />

              <div className="mt-4">
                <NotificationEmailCard form={form} handleChange={handleChange} user={user} />
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setWizardStep(2)}
                  className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={dismissWizard}
                  className="flex items-center gap-2 bg-neutral-900 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Done — go to settings
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  // ── Full settings page ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-50">
      <ConceptNav
        active="workspace"
        userLabel={user.displayName ?? user.email ?? undefined}
        saveStatus={saveStatus}
        onSignOut={() => signOut()}
      />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-12">

        {/* Header + calibration state */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Product Intelligence</h1>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed max-w-md">
                Every field below is injected into each analysis, brief, and PM chat. The more specific you are, the more your AI thinks like someone who actually knows your product.
              </p>
            </div>
            <button
              onClick={openWizard}
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors whitespace-nowrap shrink-0 mt-1"
            >
              Setup guide
            </button>
          </div>

          {/* Calibration bar */}
          {!loading && (
            <div className="mt-5 bg-white border border-neutral-200 rounded-xl px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${completionPct === 100 ? "bg-emerald-500" : completionPct > 0 ? "bg-amber-400" : "bg-neutral-300"}`} />
                  <span className={`text-sm font-semibold ${qualityColor}`}>{qualityLabel}</span>
                </div>
                <span className="text-xs text-neutral-400">{filledCount} / {FIELDS.length} fields</span>
              </div>
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${completionPct === 100 ? "bg-emerald-500" : completionPct >= 50 ? "bg-amber-400" : "bg-neutral-300"}`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              {completionPct < 100 && (
                <p className="text-xs text-neutral-400 mt-2.5">
                  {completionPct === 0
                    ? "Fill in your product context to unlock higher-quality analysis."
                    : `${FIELDS.length - filledCount} field${FIELDS.length - filledCount !== 1 ? "s" : ""} remaining — each one improves signal accuracy.`}
                </p>
              )}
              {completionPct === 100 && (
                <p className="text-xs text-emerald-600 mt-2.5 font-medium">
                  All context loaded — your AI has full product awareness.
                </p>
              )}
              {completionPct < 100 && completionPct === 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500 font-medium mb-2">Quick setup — auto-fill from your website</p>
                  {autofill.phase === "idle" || autofill.phase === "error" ? (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={autofillUrl}
                        onChange={(e) => setAutofillUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAutofill() }}
                        placeholder="https://yourproduct.com"
                        className="flex-1 text-xs border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-white"
                      />
                      <button
                        onClick={handleAutofill}
                        disabled={!autofillUrl.trim()}
                        className="text-xs font-medium px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        Auto-fill
                      </button>
                    </div>
                  ) : autofill.phase === "loading" ? (
                    <div className="flex items-center gap-2 text-xs text-neutral-400 py-1">
                      <span className="w-3 h-3 border border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                      Fetching your site…
                    </div>
                  ) : autofill.phase === "review" ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-neutral-500">Extracted from <span className="font-medium text-neutral-700">{autofill.source}</span> — review before applying:</p>
                      {autofill.productDescription && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-medium text-blue-600 mb-1">Product description</p>
                          <p className="text-xs text-neutral-700 leading-relaxed">{autofill.productDescription}</p>
                        </div>
                      )}
                      {autofill.featureAreas && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-medium text-blue-600 mb-1">Feature areas</p>
                          <p className="text-xs text-neutral-700">{autofill.featureAreas}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <button onClick={applyAutofill} className="text-xs font-medium px-3 py-1.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors">Apply suggestions</button>
                        <button onClick={() => setAutofill({ phase: "idle" })} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">Dismiss</button>
                      </div>
                    </div>
                  ) : null}
                  {autofill.phase === "error" && (
                    <p className="text-xs text-red-500 mt-1.5">{autofill.message}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Alerts & digest section ────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Alerts &amp; Digest</h2>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>

              <AlertPreferencesCard form={form} handleChange={handleChange} />

              <SignalFiltersCard form={form} handleChange={handleChange} />

              {/* Product story */}
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-4 mt-4">
                <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${form.productStory?.trim() ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Company story</span>
                    <p className="text-sm font-semibold text-neutral-800 leading-tight">One-line pitch</p>
                  </div>
                  <div className="shrink-0 hidden sm:flex items-center gap-1 text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-100 px-2 py-1 rounded-md">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z" fill="currentColor" opacity="0.5"/></svg>
                    <span>Injected into every AI draft</span>
                  </div>
                </div>
                <div className="px-5 pt-3 pb-4">
                  <p className="text-xs text-neutral-400 mb-2 leading-relaxed">One sentence. &quot;We help [who] do [what].&quot; This is injected into every WhatsApp draft so responses sound like they come from your company.</p>
                  <input
                    type="text"
                    value={form.productStory ?? ""}
                    onChange={(e) => handleChange("productStory" as keyof WorkspaceContext, e.target.value)}
                    placeholder="e.g. We help Indonesian HR teams automate payroll and attendance for SMEs."
                    className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-2.5 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-neutral-50 transition-colors"
                  />
                </div>
              </div>

              <NotificationEmailCard form={form} handleChange={handleChange} user={user} />
            </div>

            {/* ── Live integration section ──────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Live Integration</h2>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>
              <WatiWebhookCard webhookToken={webhookToken} />
            </div>

            {/* ── CRM integrations section ──────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">CRM Integrations</h2>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                When Nectic detects a critical or high-risk signal, it writes structured data directly to your CRM — making WhatsApp a first-class signal source alongside your other customer data.
              </p>
              <HubSpotCard
                connected={hubspotConnected}
                portalId={hubspotPortalId}
                onConnect={handleHubSpotConnect}
                onDisconnect={handleHubSpotDisconnect}
              />
            </div>

            {/* ── Communication voice section ───────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Communication Voice</h2>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                Tell Nectic how your team writes. Every WhatsApp draft will match your voice — not a generic AI voice.
              </p>

              {/* CSM persona name */}
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-4">
                <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${form.csPersonaName?.trim() ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Who is writing</span>
                    <p className="text-sm font-semibold text-neutral-800 leading-tight">CSM name</p>
                  </div>
                  <div className="shrink-0 hidden sm:flex items-center gap-1 text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-100 px-2 py-1 rounded-md">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z" fill="currentColor" opacity="0.5"/></svg>
                    <span>Signs every draft</span>
                  </div>
                </div>
                <div className="px-5 pt-3 pb-4">
                  <p className="text-xs text-neutral-400 mb-2 leading-relaxed">First name or name + role. Drafts will be written as this person — not an anonymous CS manager.</p>
                  <input
                    type="text"
                    value={form.csPersonaName ?? ""}
                    onChange={(e) => handleChange("csPersonaName" as keyof WorkspaceContext, e.target.value)}
                    placeholder="e.g. Reza, Sarah CS, Dian"
                    className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-2.5 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-neutral-50 transition-colors"
                  />
                </div>
              </div>

              {/* Communication style */}
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-4">
                <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${form.communicationStyle ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Writing register</span>
                    <p className="text-sm font-semibold text-neutral-800 leading-tight">How your team writes</p>
                  </div>
                </div>
                <div className="px-5 pt-3 pb-4">
                  <p className="text-xs text-neutral-400 mb-3 leading-relaxed">Drafts will match this register — same formality, same sentence length, same warmth level.</p>
                  <div className="flex gap-2 flex-wrap">
                    {([
                      { value: "formal", label: "Formal", desc: "Full sentences, professional" },
                      { value: "warm", label: "Warm & professional", desc: "Direct but empathetic" },
                      { value: "casual", label: "Casual", desc: "Conversational, natural" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleChange("communicationStyle" as keyof WorkspaceContext, opt.value)}
                        className={`flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-colors ${
                          form.communicationStyle === opt.value
                            ? "bg-neutral-900 text-white border-neutral-900"
                            : "text-neutral-600 border-neutral-200 hover:border-neutral-400 bg-white"
                        }`}
                      >
                        <span className="text-xs font-semibold">{opt.label}</span>
                        <span className={`text-[10px] mt-0.5 ${form.communicationStyle === opt.value ? "text-neutral-400" : "text-neutral-400"}`}>{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Escalation process */}
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${form.csEscalationProcess?.trim() ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Escalation</span>
                    <p className="text-sm font-semibold text-neutral-800 leading-tight">Critical account process</p>
                  </div>
                  <div className="shrink-0 hidden sm:flex items-center gap-1 text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-100 px-2 py-1 rounded-md">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z" fill="currentColor" opacity="0.5"/></svg>
                    <span>Used in critical drafts</span>
                  </div>
                </div>
                <div className="px-5 pt-3 pb-4">
                  <p className="text-xs text-neutral-400 mb-2 leading-relaxed">When a critical signal is flagged, what does your team actually do? Nectic will reference this in draft responses.</p>
                  <textarea
                    value={form.csEscalationProcess ?? ""}
                    onChange={(e) => handleChange("csEscalationProcess" as keyof WorkspaceContext, e.target.value)}
                    placeholder="e.g. Loop in account manager and schedule a call within 24h. For billing issues, escalate to finance directly. Always offer a video call for critical accounts."
                    rows={3}
                    className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-3 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-neutral-50 resize-none leading-relaxed transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* ── Product intelligence section ──────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Product Intelligence</h2>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>

              <div className="space-y-4">
                {FIELDS.map((field, i) => {
                  const isFilled = !!(form[field.key] as string)?.trim()
                  return (
                    <div
                      key={field.key}
                      className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${isFilled ? "border-neutral-200 shadow-sm" : "border-neutral-200"}`}
                    >
                      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isFilled ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
                          {field.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{i + 1} · {field.sublabel}</span>
                            {isFilled && (
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-emerald-500 shrink-0"><polyline points="2 8 6 12 14 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-neutral-800 leading-tight">{field.label}</p>
                        </div>
                        <div className="shrink-0 hidden sm:flex items-center gap-1 text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-100 px-2 py-1 rounded-md max-w-[160px]">
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z" fill="currentColor" opacity="0.5"/></svg>
                          <span className="truncate">{field.unlocks}</span>
                        </div>
                      </div>

                      {field.key === "roadmapFocus" && isFilled && isRoadmapStale(workspaceUpdatedAt) && (
                        <div className="mx-5 mt-3">
                          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <p className="text-xs text-amber-800 leading-relaxed">
                              Last updated in <span className="font-semibold">{getQuarterLabel(new Date(workspaceUpdatedAt!))}</span>. A new quarter has started — is this roadmap still current?
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="px-5 pt-3 pb-4">
                        <p className="text-xs text-neutral-400 mb-2 leading-relaxed">{field.hint}</p>
                        <textarea
                          value={(form[field.key] as string) ?? ""}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          rows={field.rows}
                          className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-3 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-neutral-50 resize-none leading-relaxed transition-colors"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="text-xs text-neutral-400 text-center pt-2">
              Changes save automatically · context applies to all future analyses
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Alert Preferences Card ────────────────────────────────────────────────────

function AlertPreferencesCard({
  form,
  handleChange,
}: {
  form: WorkspaceContext
  handleChange: (key: keyof WorkspaceContext, value: unknown) => void
}) {
  const hasPrefs = !!(form.alertThreshold || form.alertFrequency || form.alertTimezone)

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-4">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${hasPrefs ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Notifications</span>
          <p className="text-sm font-semibold text-neutral-800 leading-tight">Alert preferences</p>
        </div>
        <p className="text-xs text-neutral-400 shrink-0 hidden sm:block">When Nectic alerts you</p>
      </div>

      <div className="px-5 pt-4 pb-5 space-y-5">
        {/* Threshold */}
        <div>
          <p className="text-xs font-semibold text-neutral-700 mb-2">Which accounts trigger alerts</p>
          <div className="flex gap-2 flex-wrap">
            {([
              { value: "critical_only", label: "Critical only" },
              { value: "high_and_critical", label: "High + Critical" },
              { value: "all", label: "All accounts" },
            ] as const).map((opt) => {
              const isActive = (form.alertThreshold ?? "high_and_critical") === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleChange("alertThreshold", opt.value)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    isActive
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "text-neutral-600 border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <p className="text-xs font-semibold text-neutral-700 mb-2">How often</p>
          <div className="flex gap-2 flex-wrap">
            {([
              { value: "realtime", label: "Real-time" },
              { value: "daily", label: "Daily digest" },
              { value: "weekly", label: "Weekly" },
              { value: "paused", label: "Paused" },
            ] as const).map((opt) => {
              const isActive = (form.alertFrequency ?? "daily") === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleChange("alertFrequency", opt.value)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    isActive
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "text-neutral-600 border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Timezone */}
        <div>
          <p className="text-xs font-semibold text-neutral-700 mb-2">Your timezone</p>
          <select
            value={form.alertTimezone ?? "Asia/Jakarta"}
            onChange={(e) => handleChange("alertTimezone", e.target.value)}
            className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-2.5 text-neutral-700 focus:outline-none focus:border-neutral-400 bg-neutral-50 transition-colors"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

// ─── Notification Email Card ───────────────────────────────────────────────────

function NotificationEmailCard({
  form,
  handleChange,
  user,
}: {
  form: WorkspaceContext
  handleChange: (key: keyof WorkspaceContext, value: unknown) => void
  user: { uid: string }
}) {
  const [testSending, setTestSending] = useState(false)

  async function sendTestDigest() {
    if (testSending) return
    setTestSending(true)
    try {
      const res = await fetch("/api/concept/weekly-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, email: form.notificationEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(`Failed to send: ${data.error ?? "unknown error"}`)
      } else if (data.skipped) {
        toast.error(`Not sent: ${data.reason ?? "check server config"}`)
      } else {
        toast.success("Test digest sent — check your inbox")
      }
    } catch {
      toast.error("Network error — could not send test")
    } finally {
      setTestSending(false)
    }
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${form.notificationEmail?.trim() ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M22 17H2a3 3 0 003-3V9a7 7 0 0114 0v5a3 3 0 003 3z"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Alert email</span>
            {form.notificationEmail?.trim() && (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-emerald-500 shrink-0"><polyline points="2 8 6 12 14 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </div>
          <p className="text-sm font-semibold text-neutral-800 leading-tight">Signal alert &amp; weekly digest</p>
        </div>
        <div className="shrink-0 hidden sm:flex items-center gap-1 text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-100 px-2 py-1 rounded-md">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z" fill="currentColor" opacity="0.5"/></svg>
          <span>Critical, high risk &amp; competitor alerts</span>
        </div>
      </div>
      <div className="px-5 pt-3 pb-4 space-y-3">
        <p className="text-xs text-neutral-400 leading-relaxed">
          Nectic emails you when a critical or high-risk signal is detected, when a competitor is mentioned, and sends a weekly portfolio digest every Monday.
        </p>
        <input
          type="email"
          value={form.notificationEmail ?? ""}
          onChange={(e) => handleChange("notificationEmail" as keyof WorkspaceContext, e.target.value)}
          placeholder="you@yourcompany.com"
          className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-2.5 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-neutral-50 transition-colors"
        />
        {form.notificationEmail?.trim() && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={sendTestDigest}
              disabled={testSending}
              className="text-xs font-medium px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              {testSending ? "Sending…" : "Send test digest"}
            </button>
            <span className="text-[11px] text-neutral-400">Sends a sample digest to this address</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── WATI Webhook Card ────────────────────────────────────────────────────────

function WatiWebhookCard({ webhookToken }: { webhookToken: string | null }) {
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== "undefined" ? window.location.origin : "https://app.nectic.xyz"
  const webhookUrl = webhookToken ? `${origin}/api/wati/webhook?token=${webhookToken}` : null

  function copyUrl() {
    if (!webhookUrl) return
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-4">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${webhookToken ? "bg-[#25D366] text-white" : "bg-neutral-100 text-neutral-400"}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Real-time</span>
          <p className="text-sm font-semibold text-neutral-800 leading-tight">WATI live webhook</p>
        </div>
        {webhookToken && (
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">Active</span>
        )}
      </div>

      <div className="px-5 pt-4 pb-5">
        <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
          Connect WATI to Nectic so every incoming WhatsApp message is analyzed automatically — no manual upload needed.
          After 30+ messages or 4h of silence, Nectic triggers an analysis and surfaces signals automatically.
        </p>

        {webhookUrl ? (
          <>
            <p className="text-xs font-semibold text-neutral-700 mb-2">Your webhook URL</p>
            <div className="flex items-center gap-2 mb-4">
              <code className="flex-1 text-[11px] font-mono bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-600 truncate">
                {webhookUrl}
              </code>
              <button
                onClick={copyUrl}
                className={`flex-shrink-0 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                  copied
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                }`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-neutral-700">Setup in WATI (2 minutes)</p>
              <ol className="text-xs text-neutral-500 space-y-1 list-none">
                <li className="flex gap-2"><span className="font-semibold text-neutral-400">1.</span>Go to WATI → Settings → Webhooks</li>
                <li className="flex gap-2"><span className="font-semibold text-neutral-400">2.</span>Paste the URL above as the Webhook URL</li>
                <li className="flex gap-2"><span className="font-semibold text-neutral-400">3.</span>Select event: <strong>Message</strong></li>
                <li className="flex gap-2"><span className="font-semibold text-neutral-400">4.</span>Save — Nectic starts receiving messages immediately</li>
              </ol>
            </div>
          </>
        ) : (
          <div className="text-xs text-neutral-400 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3">
            Save your workspace settings once to generate your webhook URL.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Signal Filters Card ────────────────────────────────────────────────────────

const ALL_SIGNAL_TYPES: { value: string; label: string; description: string }[] = [
  { value: "competitor_mention", label: "Competitor mentions", description: "Customer mentions a competing product" },
  { value: "pricing_concern", label: "Pricing concerns", description: "Pushback on price or ROI" },
  { value: "disengagement", label: "Disengagement", description: "Decreasing activity or response rate" },
  { value: "complaint", label: "Complaints", description: "Direct complaints about your product" },
  { value: "escalation", label: "Escalations", description: "Customer escalating urgency or frustration" },
  { value: "bug_report", label: "Bug reports", description: "Technical issues reported in chat" },
  { value: "feature_request", label: "Feature requests", description: "Requests for new capabilities" },
  { value: "praise", label: "Praise", description: "Positive feedback and satisfaction signals" },
  { value: "support_request", label: "Support requests", description: "How-to questions and help requests" },
]

function SignalFiltersCard({
  form,
  handleChange,
}: {
  form: WorkspaceContext
  handleChange: (key: keyof WorkspaceContext, value: unknown) => void
}) {
  const suppressed = form.suppressedSignalTypes ?? []

  function toggle(value: string) {
    const next = suppressed.includes(value)
      ? suppressed.filter((v) => v !== value)
      : [...suppressed, value]
    handleChange("suppressedSignalTypes", next)
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-4">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${suppressed.length > 0 ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Noise reduction</span>
          <p className="text-sm font-semibold text-neutral-800 leading-tight">Signal filters</p>
        </div>
        <p className="text-xs text-neutral-400 shrink-0 hidden sm:block">
          {suppressed.length > 0 ? `${suppressed.length} hidden` : "All signal types visible"}
        </p>
      </div>

      <div className="px-5 pt-4 pb-5">
        <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
          Hide signal types that aren&apos;t relevant to your workflow. Hidden signals won&apos;t appear in the inbox or account pages.
        </p>
        <div className="space-y-2">
          {ALL_SIGNAL_TYPES.map((st) => {
            const isSuppressed = suppressed.includes(st.value)
            return (
              <button
                key={st.value}
                type="button"
                onClick={() => toggle(st.value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                  isSuppressed
                    ? "bg-neutral-50 border-neutral-200 opacity-60"
                    : "bg-white border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors border ${
                  isSuppressed ? "bg-neutral-200 border-neutral-300" : "bg-neutral-900 border-neutral-900"
                }`}>
                  {!isSuppressed && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${isSuppressed ? "text-neutral-400 line-through" : "text-neutral-800"}`}>{st.label}</span>
                  <span className="text-xs text-neutral-400 ml-2">{st.description}</span>
                </div>
                {isSuppressed && (
                  <span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded flex-shrink-0">hidden</span>
                )}
              </button>
            )
          })}
        </div>
        {suppressed.length > 0 && (
          <button
            type="button"
            onClick={() => handleChange("suppressedSignalTypes", [])}
            className="mt-3 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            Reset — show all signal types
          </button>
        )}
      </div>
    </div>
  )
}

// ─── HubSpot Integration Card ─────────────────────────────────────────────────

function HubSpotCard({
  connected,
  portalId,
  onConnect,
  onDisconnect,
}: {
  connected: boolean
  portalId: string | null
  onConnect: () => void
  onDisconnect: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  const FIELDS_WRITTEN = [
    { name: "nectic_risk_level", desc: "critical / high / medium / low" },
    { name: "nectic_signal_summary", desc: "Top signal title from WhatsApp analysis" },
    { name: "nectic_last_signal_date", desc: "Date of last detected signal" },
    { name: "nectic_arr_at_risk", desc: "Estimated ARR at risk (USD)" },
    { name: "nectic_health_score", desc: "0–10 account health score" },
  ]

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-4">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
        {/* HubSpot logo */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${connected ? "bg-[#FF7A59]" : "bg-neutral-100"}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={connected ? "text-white" : "text-neutral-400"}>
            <path d="M18.164 7.93V5.084a2.198 2.198 0 10-2.234 0V7.93a6.249 6.249 0 00-3.056 1.658L7.32 6.146a2.462 2.462 0 10-.912 1.498l5.427 3.359a6.25 6.25 0 000 4.995l-5.427 3.359a2.462 2.462 0 10.912 1.498l5.554-3.443a6.25 6.25 0 109.29-9.482zm-1.117 9.32a3.746 3.746 0 110-7.492 3.746 3.746 0 010 7.492z" fill="currentColor"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">CRM sync</span>
          <p className="text-sm font-semibold text-neutral-800 leading-tight">HubSpot</p>
        </div>
        {connected ? (
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded flex-shrink-0">Connected</span>
        ) : (
          <span className="text-[10px] font-medium text-neutral-400 bg-neutral-50 border border-neutral-200 px-2 py-1 rounded flex-shrink-0">Not connected</span>
        )}
      </div>

      <div className="px-5 pt-4 pb-5">
        {connected ? (
          <div className="space-y-4">
            {portalId && (
              <p className="text-xs text-neutral-500">
                Connected to portal <span className="font-mono font-semibold text-neutral-700">{portalId}</span>
              </p>
            )}

            <div>
              <p className="text-xs font-semibold text-neutral-700 mb-2">Fields Nectic writes to your company records:</p>
              <div className="space-y-1.5">
                {FIELDS_WRITTEN.map((f) => (
                  <div key={f.name} className="flex items-start gap-2">
                    <span className="font-mono text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">{f.name}</span>
                    <span className="text-xs text-neutral-500">{f.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              On every critical or high-risk analysis, Nectic searches HubSpot for a matching company by name and updates these fields. Your existing HubSpot automations can then fire — deal stage changes, task creation, Slack notifications.
            </p>

            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="text-xs text-neutral-400 hover:text-red-600 transition-colors"
              >
                Disconnect HubSpot
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-xs text-neutral-600">Disconnect and stop syncing?</p>
                <button onClick={onDisconnect} className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors">Disconnect</button>
                <button onClick={() => setConfirming(false)} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">Cancel</button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Connect HubSpot to make WhatsApp signals visible in your CRM. When Nectic detects a risk signal, it automatically updates the matching company record — no manual data entry.
            </p>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-1.5">
              {FIELDS_WRITTEN.map((f) => (
                <div key={f.name} className="flex items-start gap-2">
                  <span className="font-mono text-[10px] bg-white text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200 flex-shrink-0 mt-0.5">{f.name}</span>
                  <span className="text-xs text-neutral-400">{f.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-neutral-400">Requires: <span className="font-medium">crm.objects.companies.read/write</span> scope. No data is read from HubSpot — Nectic only writes.</p>
            <button
              onClick={onConnect}
              className="flex items-center gap-2 bg-[#FF7A59] text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-[#e85f40] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.164 7.93V5.084a2.198 2.198 0 10-2.234 0V7.93a6.249 6.249 0 00-3.056 1.658L7.32 6.146a2.462 2.462 0 10-.912 1.498l5.427 3.359a6.25 6.25 0 000 4.995l-5.427 3.359a2.462 2.462 0 10.912 1.498l5.554-3.443a6.25 6.25 0 109.29-9.482zm-1.117 9.32a3.746 3.746 0 110-7.492 3.746 3.746 0 010 7.492z"/>
              </svg>
              Connect HubSpot
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
