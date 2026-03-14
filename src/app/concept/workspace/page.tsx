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
  | { phase: "review"; productDescription: string; productStory: string; featureAreas: string; roadmapFocus: string; source: string; additionalSources?: string[] }
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
  const [hubspotConnected, setHubspotConnected] = useState(false)
  const [hubspotPortalId, setHubspotPortalId] = useState<string | null>(null)
  const [attioConnected, setAttioConnected] = useState(false)
  const [attioWorkspaceId, setAttioWorkspaceId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"intelligence" | "voice" | "alerts" | "connections">("intelligence")
  const [waStatus, setWaStatus] = useState<"none" | "pending_qr" | "connected" | "reconnecting" | "disconnected">("none")
  const [waQrCode, setWaQrCode] = useState<string | null>(null)
  const [waPhone, setWaPhone] = useState<string | null>(null)
  const [waGroups, setWaGroups] = useState<{ jid: string; name: string; participantCount: number }[]>([])
  const [waMonitored, setWaMonitored] = useState<string[]>([])
  const [waConnecting, setWaConnecting] = useState(false)
  const [waShowGroupPicker, setWaShowGroupPicker] = useState(false)
  const waPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
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
      if (ws.hubspotConnected) setHubspotConnected(true)
      if (ws.hubspotPortalId) setHubspotPortalId(ws.hubspotPortalId)
      if (ws.attioConnected) setAttioConnected(true)
      if (ws.attioWorkspaceId) setAttioWorkspaceId(ws.attioWorkspaceId)
      setLoading(false)
      // WhatsApp Direct status is polled on mount via pollWaStatus — no need to seed here

      if (!ws.productDescription && !ws.communicationStyle && typeof window !== "undefined") {
        const dismissed = localStorage.getItem("nectic_workspace_wizard_dismissed")
        if (!dismissed) setWizardMode(true)
      }
    })
  }, [user])

  // Handle OAuth callback results
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "connections" || tab === "voice" || tab === "alerts" || tab === "intelligence") {
      setActiveTab(tab)
    }
    if (searchParams.get("hubspot_connected") === "1") {
      toast.success("HubSpot connected — risk signals will now sync automatically")
      setHubspotConnected(true)
    }
    const hsErr = searchParams.get("hubspot_error")
    if (hsErr) toast.error(`HubSpot connection failed: ${hsErr}`)
    if (searchParams.get("attio_connected") === "1") {
      toast.success("Attio connected — risk signals will now sync automatically")
      setAttioConnected(true)
    }
    const attioErr = searchParams.get("attio_error")
    if (attioErr) toast.error(`Attio connection failed: ${attioErr}`)
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

  const handleAttioConnect = async () => {
    if (!user) return
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return
      window.location.href = `/api/integrations/attio/connect?token=${encodeURIComponent(token)}`
    } catch {
      toast.error("Couldn't start Attio connection")
    }
  }

  const handleAttioDisconnect = async () => {
    if (!user) return
    try {
      const token = await auth.currentUser?.getIdToken()
      await fetch("/api/integrations/attio/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      setAttioConnected(false)
      setAttioWorkspaceId(null)
      toast.success("Attio disconnected")
    } catch {
      toast.error("Disconnect failed — try again")
    }
  }

  // ── WhatsApp Direct ─────────────────────────────────────────────────────────

  const pollWaStatus = useCallback(async () => {
    if (!user) return
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch("/api/whatsapp/status", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setWaStatus(data.status ?? "none")
      setWaQrCode(data.qrCode ?? null)
      if (data.phoneNumber) setWaPhone(data.phoneNumber)
      if (data.groups?.length > 0) setWaGroups(data.groups)
      if (data.monitoredGroups?.length > 0) setWaMonitored(data.monitoredGroups)
      // Stop polling once connected or disconnected
      if (data.status === "connected" || data.status === "disconnected" || data.status === "none") {
        if (waPollRef.current) clearInterval(waPollRef.current)
        if (data.status === "connected") {
          setWaConnecting(false)
          setWaShowGroupPicker(true)
        }
      }
    } catch {}
  }, [user])

  // On mount: check existing WA status
  useEffect(() => {
    if (user) pollWaStatus()
    return () => { if (waPollRef.current) clearInterval(waPollRef.current) }
  }, [user, pollWaStatus])

  const handleWaConnect = async () => {
    if (!user) return
    setWaConnecting(true)
    setWaStatus("pending_qr")
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch("/api/whatsapp/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? "Could not start WhatsApp connection")
        setWaConnecting(false)
        return
      }
      // Start polling for QR code
      if (waPollRef.current) clearInterval(waPollRef.current)
      waPollRef.current = setInterval(pollWaStatus, 2000)
    } catch {
      toast.error("Network error — try again")
      setWaConnecting(false)
    }
  }

  const handleWaDisconnect = async () => {
    if (!user) return
    try {
      const token = await auth.currentUser?.getIdToken()
      await fetch("/api/whatsapp/session", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      setWaStatus("none")
      setWaQrCode(null)
      setWaPhone(null)
      setWaGroups([])
      setWaMonitored([])
      setWaShowGroupPicker(false)
      toast.success("WhatsApp disconnected")
    } catch {
      toast.error("Disconnect failed — try again")
    }
  }

  const handleWaToggleGroup = async (jid: string) => {
    const next = waMonitored.includes(jid)
      ? waMonitored.filter(j => j !== jid)
      : [...waMonitored, jid]
    setWaMonitored(next)
    try {
      const token = await auth.currentUser?.getIdToken()
      await fetch("/api/whatsapp/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groupJids: next }),
      })
    } catch {
      toast.error("Could not save group selection")
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
      setAutofill({ phase: "review", productDescription: data.productDescription, productStory: data.productStory ?? "", featureAreas: data.featureAreas, roadmapFocus: data.roadmapFocus ?? "", source: data.source, additionalSources: data.additionalSources })
    } catch {
      setAutofill({ phase: "error", message: "Network error — please try again." })
    }
  }

  const applyAutofill = () => {
    if (autofill.phase !== "review") return
    if (autofill.productDescription) handleChange("productDescription", autofill.productDescription)
    if (autofill.featureAreas) handleChange("featureAreas", autofill.featureAreas)
    if (autofill.productStory) handleChange("productStory", autofill.productStory)
    if (autofill.roadmapFocus) handleChange("roadmapFocus", autofill.roadmapFocus)
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

        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Workspace settings</h1>
            <p className="text-sm text-neutral-500 mt-1 leading-relaxed max-w-md">
              Configure how Nectic understands your product, sounds when it drafts, and where it sends data.
            </p>
          </div>
          <button
            onClick={openWizard}
            className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors whitespace-nowrap shrink-0 mt-1"
          >
            Setup guide
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 mb-6">
          {([
            { id: "intelligence", label: "Intelligence", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> },
            { id: "voice", label: "Voice", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
            { id: "alerts", label: "Alerts", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
            { id: "connections", label: "Connections", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : (
          <>

            {/* ── 1. Agent Intelligence ─────────────────────────────────── */}
            {activeTab === "intelligence" && <section>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-sm font-semibold text-neutral-900">Agent Intelligence</h2>
                <div className="flex-1 h-px bg-neutral-200" />
                <button onClick={openWizard} className="text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors shrink-0">Setup guide</button>
              </div>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                Everything here is injected into every analysis and AI draft. The more specific you are, the more Nectic thinks like someone who actually knows your product.
              </p>

              {/* Calibration bar */}
              <div className="bg-white border border-neutral-200 rounded-xl px-5 py-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${completionPct === 100 ? "bg-emerald-500" : completionPct > 0 ? "bg-amber-400" : "bg-neutral-300"}`} />
                    <span className={`text-sm font-semibold ${qualityColor}`}>{qualityLabel}</span>
                  </div>
                  <span className="text-xs text-neutral-400">{filledCount} / {FIELDS.length} fields filled</span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${completionPct === 100 ? "bg-emerald-500" : completionPct >= 50 ? "bg-amber-400" : "bg-neutral-300"}`}
                    style={{ width: `${Math.max(completionPct, 4)}%` }}
                  />
                </div>
                {completionPct === 100 ? (
                  <p className="text-xs text-emerald-600 mt-2.5 font-medium">All context loaded — your agent has full product awareness.</p>
                ) : (
                  <p className="text-xs text-neutral-400 mt-2.5">
                    {completionPct === 0 ? "Fill in your product context to unlock higher-quality analysis." : `${FIELDS.length - filledCount} field${FIELDS.length - filledCount !== 1 ? "s" : ""} remaining — each one improves signal accuracy.`}
                  </p>
                )}

                {/* Autofill widget — always visible */}
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500 font-medium mb-2">{completionPct === 0 ? "Quick setup — auto-fill from your website" : "Auto-fill from website"}</p>
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
                      <button onClick={handleAutofill} disabled={!autofillUrl.trim()} className="text-xs font-medium px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
                        Auto-fill
                      </button>
                    </div>
                  ) : autofill.phase === "loading" ? (
                    <div className="flex items-center gap-2 text-xs text-neutral-400 py-1">
                      <span className="w-3 h-3 border border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />Fetching your site…
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
                      {autofill.productStory && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-medium text-blue-600 mb-1">One-line pitch</p>
                          <p className="text-xs text-neutral-700 leading-relaxed">{autofill.productStory}</p>
                        </div>
                      )}
                      {autofill.featureAreas && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-medium text-blue-600 mb-1">Feature areas</p>
                          <p className="text-xs text-neutral-700">{autofill.featureAreas}</p>
                        </div>
                      )}
                      {autofill.roadmapFocus && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-medium text-blue-600 mb-1">Roadmap focus</p>
                          <p className="text-xs text-neutral-700">{autofill.roadmapFocus}</p>
                        </div>
                      )}
                      {autofill.additionalSources && autofill.additionalSources.length > 0 && (
                        <p className="text-[11px] text-neutral-400">Also scanned: {autofill.additionalSources.join(", ")}</p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <button onClick={applyAutofill} className="text-xs font-medium px-3 py-1.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors">Apply suggestions</button>
                        <button onClick={() => setAutofill({ phase: "idle" })} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">Dismiss</button>
                      </div>
                    </div>
                  ) : null}
                  {autofill.phase === "error" && <p className="text-xs text-red-500 mt-1.5">{autofill.message}</p>}
                </div>
              </div>

              {/* Product story — one-line pitch, injected into every draft */}
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-4">
                <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${form.productStory?.trim() ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Company story</span>
                    <p className="text-sm font-semibold text-neutral-800 leading-tight">One-line pitch</p>
                  </div>
                  <span className="text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-100 px-2 py-1 rounded hidden sm:block">In every draft</span>
                </div>
                <div className="px-5 pt-3 pb-4">
                  <p className="text-xs text-neutral-400 mb-2 leading-relaxed">"We help [who] do [what]." Injected into every WhatsApp draft so responses sound like they come from your company, not a generic AI.</p>
                  <input
                    type="text"
                    value={form.productStory ?? ""}
                    onChange={(e) => handleChange("productStory" as keyof WorkspaceContext, e.target.value)}
                    placeholder="e.g. We help Indonesian HR teams automate payroll and attendance for SMEs."
                    className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-2.5 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-neutral-50 transition-colors"
                  />
                </div>
              </div>

              {/* Product context fields */}
              <div className="space-y-4">
                {FIELDS.map((field, i) => {
                  const isFilled = !!(form[field.key] as string)?.trim()
                  return (
                    <div key={field.key} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isFilled ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
                          {field.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{i + 1} · {field.sublabel}</span>
                            {isFilled && <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-emerald-500 shrink-0"><polyline points="2 8 6 12 14 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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
                            <p className="text-xs text-amber-800 leading-relaxed">Last updated in <span className="font-semibold">{getQuarterLabel(new Date(workspaceUpdatedAt!))}</span>. A new quarter has started — is this roadmap still current?</p>
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
            </section>}

            {/* ── 2. Agent Voice ────────────────────────────────────────── */}
            {activeTab === "voice" && <section>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-sm font-semibold text-neutral-900">Agent Voice</h2>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                Tell Nectic how your team writes. Every WhatsApp draft will sound like your team — not a generic AI.
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
                  <span className="text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-100 px-2 py-1 rounded hidden sm:block">Signs every draft</span>
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
            </section>}

            {/* ── 3. Alerts ─────────────────────────────────────────────── */}
            {activeTab === "alerts" && <section>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-sm font-semibold text-neutral-900">Alerts</h2>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                Control when Nectic notifies you and which signal types matter to your team.
              </p>
              <AlertPreferencesCard form={form} handleChange={handleChange} />
              <NotificationEmailCard form={form} handleChange={handleChange} user={user} />
              <div className="mt-4">
                <SignalFiltersCard form={form} handleChange={handleChange} />
              </div>
            </section>}

            {/* ── 4. Connections ────────────────────────────────────────── */}
            {activeTab === "connections" && <section>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-sm font-semibold text-neutral-900">Connections</h2>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                Connect WhatsApp to start ingesting customer conversations. Connect your CRM to push alerts and health scores without manual entry.
              </p>

              {/* WhatsApp Direct — primary ingestion */}
              <WhatsAppDirectCard
                status={waStatus}
                qrCode={waQrCode}
                phone={waPhone}
                groups={waGroups}
                monitored={waMonitored}
                connecting={waConnecting}
                showGroupPicker={waShowGroupPicker}
                onConnect={handleWaConnect}
                onDisconnect={handleWaDisconnect}
                onToggleGroup={handleWaToggleGroup}
                onDoneGroupPicker={() => setWaShowGroupPicker(false)}
              />

              {/* Active CRM integrations */}
              <div className="mt-2 space-y-3">
                <HubSpotCard
                  connected={hubspotConnected}
                  portalId={hubspotPortalId}
                  onConnect={handleHubSpotConnect}
                  onDisconnect={handleHubSpotDisconnect}
                />
                <AttioCard
                  connected={attioConnected}
                  workspaceId={attioWorkspaceId}
                  onConnect={handleAttioConnect}
                  onDisconnect={handleAttioDisconnect}
                />
              </div>

              {/* Coming soon integrations */}
              <div className="mt-6">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Coming soon</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    {
                      name: "Salesforce",
                      desc: "Write signals to opportunity and account records",
                      // Salesforce cloud logo (overlapping circles forming cloud shape)
                      icon: <svg width="16" height="16" viewBox="0 0 48 48" fill="currentColor" className="text-[#00A1E0]"><path d="M20 8a9 9 0 00-8.95 8.06A7 7 0 008 22a7 7 0 007 7h20a6 6 0 000-12 6 6 0 00-.8.05A9 9 0 0020 8z"/></svg>,
                    },
                    {
                      name: "Pipedrive",
                      desc: "Update deal health and add signal notes",
                      // Pipedrive: circle + descending stem (pipeline stage metaphor)
                      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#1A3C34]"><circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="13" x2="12" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><circle cx="12" cy="21" r="1.5" fill="currentColor"/></svg>,
                    },
                    {
                      name: "Planhat",
                      desc: "Push health scores and signal events to CS platform",
                      // Planhat: area chart / health trend visualization
                      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3366FF]"><polyline points="2 18 7 10 12 14 17 6 22 10"/><path d="M2 18h20" strokeOpacity="0.4"/></svg>,
                    },
                    {
                      name: "Slack",
                      desc: "Alert your CS channel when a critical signal fires",
                      // Slack: accurate hashtag/hash grid logo
                      icon: <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#4A154B]" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.527 2.527 0 012.521 2.522v2.52H8.834zm0 1.271a2.527 2.527 0 012.521 2.521 2.527 2.527 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.527 2.527 0 01-2.522 2.521h-2.522V8.834zm-1.268 0a2.527 2.527 0 01-2.521 2.521 2.527 2.527 0 01-2.521-2.521V2.522A2.528 2.528 0 0115.167 0a2.528 2.528 0 012.521 2.522v6.312zm-2.521 10.122a2.528 2.528 0 012.521 2.522A2.528 2.528 0 0115.167 24a2.527 2.527 0 01-2.521-2.522v-2.522h2.521zm0-1.268a2.527 2.527 0 01-2.521-2.521 2.527 2.527 0 012.521-2.521h6.313A2.528 2.528 0 0124 15.165a2.528 2.528 0 01-2.522 2.521h-6.313z"/></svg>,
                    },
                    {
                      name: "Linear",
                      desc: "Auto-create issues from product signals",
                      // Linear: diagonal gradient arc — their actual logomark style
                      icon: <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#5E6AD2]" fill="currentColor"><path d="M3.256 10.027c.059.31.283.535.594.535.22 0 .398-.1.507-.26l5.846-8.7c.122-.18.08-.42-.1-.543a.393.393 0 00-.545.1L3.71 9.46a.393.393 0 00-.455.567zm-.86 3.026a.392.392 0 00.16.537l14.362 7.8c.19.103.43.033.534-.158a.392.392 0 00-.159-.535L2.891 12.896a.393.393 0 00-.496.157zm1.66-1.46l14.79-4.3a.393.393 0 00.266-.49.393.393 0 00-.49-.266L4.83 10.836a.393.393 0 00.226.757zM21.667 12c0 5.334-4.333 9.667-9.667 9.667-5.334 0-9.667-4.333-9.667-9.667C2.333 6.666 6.666 2.333 12 2.333c5.334 0 9.667 4.333 9.667 9.667z"/></svg>,
                    },
                    {
                      name: "Freshdesk",
                      desc: "Log signals as support tickets automatically",
                      // Freshdesk: headset support icon (their support-first brand identity)
                      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[#2BBBAD]"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z"/><path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>,
                    },
                  ].map((item) => (
                    <div key={item.name} className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 flex flex-col gap-2 opacity-70">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">Soon</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-700">{item.name}</p>
                        <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-400 mt-3 text-center">
                  Want an integration prioritised?{" "}
                  <a href="mailto:hello@nectic.xyz" className="underline hover:text-neutral-600 transition-colors">Tell us →</a>
                </p>
              </div>
            </section>}

            <p className="text-xs text-neutral-400 text-center pt-2">
              Changes save automatically · context applies to all future analyses
            </p>
          </>
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

// ─── Attio Integration Card ───────────────────────────────────────────────────

function AttioCard({
  connected,
  workspaceId,
  onConnect,
  onDisconnect,
}: {
  connected: boolean
  workspaceId: string | null
  onConnect: () => void
  onDisconnect: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  const FIELDS_WRITTEN = [
    { name: "nectic_risk_level", desc: "critical / high / medium / low" },
    { name: "nectic_signal_summary", desc: "Top signal title from WhatsApp analysis" },
    { name: "nectic_health_score", desc: "0–10 account health score" },
    { name: "nectic_arr_at_risk", desc: "Estimated ARR at risk (USD)" },
    { name: "nectic_last_signal_date", desc: "Date of last detected signal" },
  ]

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${connected ? "bg-neutral-900" : "bg-neutral-100"}`}>
          {/* Attio wordmark-style A */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={connected ? "text-white" : "text-neutral-400"}>
            <path d="M12 2L2 19h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <line x1="7" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">CRM sync</span>
          <p className="text-sm font-semibold text-neutral-800 leading-tight">Attio</p>
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
            {workspaceId && (
              <p className="text-xs text-neutral-500">Workspace <span className="font-mono font-semibold text-neutral-700">{workspaceId}</span></p>
            )}
            <div>
              <p className="text-xs font-semibold text-neutral-700 mb-2">Attributes Nectic writes to your company records:</p>
              <div className="space-y-1.5">
                {FIELDS_WRITTEN.map((f) => (
                  <div key={f.name} className="flex items-start gap-2">
                    <span className="font-mono text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">{f.name}</span>
                    <span className="text-xs text-neutral-500">{f.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            {!confirming ? (
              <button onClick={() => setConfirming(true)} className="text-xs text-neutral-400 hover:text-red-600 transition-colors">
                Disconnect Attio
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
              Connect Attio to make WhatsApp signals visible in your CRM. Nectic automatically updates matching company records when it detects critical or high-risk signals.
            </p>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-1.5">
              {FIELDS_WRITTEN.map((f) => (
                <div key={f.name} className="flex items-start gap-2">
                  <span className="font-mono text-[10px] bg-white text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200 flex-shrink-0 mt-0.5">{f.name}</span>
                  <span className="text-xs text-neutral-400">{f.desc}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onConnect}
              className="flex items-center gap-2 bg-[#1A1A2E] text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-[#2d2d4e] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 19h20L12 2z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
                <line x1="7" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="2.5"/>
              </svg>
              Connect Attio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── WhatsApp Direct Card ─────────────────────────────────────────────────────

function WhatsAppDirectCard({
  status,
  qrCode,
  phone,
  groups,
  monitored,
  connecting,
  showGroupPicker,
  onConnect,
  onDisconnect,
  onToggleGroup,
  onDoneGroupPicker,
}: {
  status: "none" | "pending_qr" | "connected" | "reconnecting" | "disconnected"
  qrCode: string | null
  phone: string | null
  groups: { jid: string; name: string; participantCount: number }[]
  monitored: string[]
  connecting: boolean
  showGroupPicker: boolean
  onConnect: () => void
  onDisconnect: () => void
  onToggleGroup: (jid: string) => void
  onDoneGroupPicker: () => void
}) {
  const isConnected = status === "connected"
  const isPendingQR = status === "pending_qr"

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-neutral-100">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isConnected ? "bg-[#25D366]" : "bg-neutral-100"}`}>
          {/* WhatsApp logo */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill={isConnected ? "white" : "#9ca3af"}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Group chat monitoring</span>
          <p className="text-sm font-semibold text-neutral-800 leading-tight">WhatsApp</p>
        </div>
        {isConnected && (
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">Connected</span>
        )}
        {status === "reconnecting" && (
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0">Reconnecting…</span>
        )}
      </div>

      <div className="px-5 pt-4 pb-5">
        {/* ── Not connected ── */}
        {(status === "none" || status === "disconnected") && !isPendingQR && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Scan once to connect your WhatsApp. Nectic reads your selected customer group chats in real time and alerts you when something needs your attention. Free to use — works alongside your existing WhatsApp setup.
            </p>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 mt-0.5 shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <p className="text-[11px] text-amber-800 leading-relaxed">Beta — works the same way as WhatsApp Desktop. Keep your phone connected. If your phone goes offline for an extended period, you&apos;ll need to re-scan once. You can disconnect anytime from this page or from your phone under Settings → Linked Devices.</p>
            </div>
            <button
              onClick={onConnect}
              disabled={connecting}
              className="flex items-center gap-2 bg-[#25D366] text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-[#1ebe5d] transition-colors disabled:opacity-50"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              {connecting ? "Starting…" : "Connect WhatsApp"}
            </button>
          </div>
        )}

        {/* ── QR code modal ── */}
        {isPendingQR && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Open WhatsApp on your phone → <strong>Settings → Linked Devices → Link a Device</strong> → scan this QR code.
            </p>
            <div className="flex items-center justify-center">
              {qrCode ? (
                <div className="border border-neutral-200 rounded-xl p-3 bg-white inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="WhatsApp QR code" width={200} height={200} className="rounded-lg" />
                </div>
              ) : (
                <div className="w-[200px] h-[200px] border border-neutral-200 rounded-xl bg-neutral-50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 text-center">QR code refreshes automatically · keep this page open</p>
            <button onClick={onDisconnect} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors block mx-auto">Cancel</button>
          </div>
        )}

        {/* ── Connected + group picker ── */}
        {isConnected && (
          <div className="space-y-4">
            {phone && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-xs text-neutral-700">Connected as <span className="font-semibold">+{phone}</span></p>
              </div>
            )}

            {/* Group picker */}
            {showGroupPicker ? (
              <div>
                <p className="text-xs font-semibold text-neutral-700 mb-2">
                  Select groups to monitor ({monitored.length} selected)
                </p>
                <p className="text-[11px] text-neutral-400 mb-3">Nectic will watch these groups and alert you when a customer needs attention.</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {groups.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-4 text-center">No groups found — make sure you&apos;re in at least one WhatsApp group</p>
                  ) : (
                    groups.map((g) => {
                      const isOn = monitored.includes(g.jid)
                      return (
                        <button
                          key={g.jid}
                          onClick={() => onToggleGroup(g.jid)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${
                            isOn
                              ? "bg-neutral-900 border-neutral-900 text-white"
                              : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isOn ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"}`}>
                              {g.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{g.name}</p>
                              <p className={`text-[10px] ${isOn ? "text-neutral-300" : "text-neutral-400"}`}>{g.participantCount} participants</p>
                            </div>
                          </div>
                          {isOn && (
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><polyline points="2 8 6 12 14 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
                <button
                  onClick={onDoneGroupPicker}
                  className="mt-3 w-full text-xs font-semibold bg-neutral-900 text-white py-2.5 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Done — monitor {monitored.length} group{monitored.length !== 1 ? "s" : ""}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-neutral-700">Monitored groups</p>
                  <button onClick={() => onDoneGroupPicker()} className="text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors">Edit</button>
                </div>
                {monitored.length === 0 ? (
                  <button
                    onClick={() => onDoneGroupPicker()}
                    className="w-full text-xs text-neutral-400 border border-dashed border-neutral-300 rounded-lg py-3 hover:border-neutral-500 hover:text-neutral-600 transition-colors"
                  >
                    + Select groups to monitor
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    {groups.filter(g => monitored.includes(g.jid)).map(g => (
                      <div key={g.jid} className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-[9px] font-bold text-neutral-600 flex-shrink-0">
                          {g.name.slice(0, 2).toUpperCase()}
                        </div>
                        <p className="text-xs text-neutral-700 truncate">{g.name}</p>
                        <span className="text-[10px] text-neutral-400 ml-auto flex-shrink-0">{g.participantCount} members</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-1 border-t border-neutral-100">
              <button onClick={onDisconnect} className="text-xs text-neutral-400 hover:text-red-600 transition-colors">
                Disconnect WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
