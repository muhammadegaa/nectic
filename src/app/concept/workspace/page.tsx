"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { useAuth } from "@/contexts/auth-context"
import { getWorkspace, saveWorkspace, type WorkspaceContext } from "@/lib/concept-firestore"

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

export default function WorkspacePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState<WorkspaceContext>({
    productDescription: "",
    featureAreas: "",
    roadmapFocus: "",
    knownIssues: "",
  })
  const [workspaceUpdatedAt, setWorkspaceUpdatedAt] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestForm = useRef(form)
  const [autofillUrl, setAutofillUrl] = useState("")
  const [autofill, setAutofill] = useState<AutofillState>({ phase: "idle" })

  useEffect(() => {
    if (!authLoading && !user) router.replace("/concept/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    getWorkspace(user.uid).then((ws) => {
      const loaded = {
        productDescription: ws.productDescription ?? "",
        featureAreas: ws.featureAreas ?? "",
        roadmapFocus: ws.roadmapFocus ?? "",
        knownIssues: ws.knownIssues ?? "",
      }
      setForm(loaded)
      latestForm.current = loaded
      setWorkspaceUpdatedAt(ws.updatedAt)
      setLoading(false)
    })
  }, [user])

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

  const handleChange = (key: keyof WorkspaceContext, value: string) => {
    const next = { ...form, [key]: value }
    setForm(next)
    latestForm.current = next
    triggerSave(next)
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

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b border-neutral-200 px-4 sm:px-6 h-12 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <LogoIcon size={20} />
            <span className="text-sm font-semibold text-neutral-900">Nectic</span>
          </Link>
          <span className="text-neutral-200 hidden sm:inline">·</span>
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <Link href="/concept" className="text-neutral-400 hover:text-neutral-700 transition-colors">Accounts</Link>
            <Link href="/concept/board" className="text-neutral-400 hover:text-neutral-700 transition-colors">Signal board</Link>
            <span className="text-neutral-900 font-semibold border-b-2 border-neutral-900 pb-0.5">Workspace</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <span className="w-3 h-3 border border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
              Saving…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-emerald-600 flex items-center gap-1.5 transition-opacity">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polyline points="2 8 6 12 14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Saved
            </span>
          )}
          <div className="flex items-center gap-2 pl-3 border-l border-neutral-200 text-xs text-neutral-400">
            <span className="hidden sm:block">{user.displayName ?? user.email}</span>
            <button onClick={() => signOut()} className="hover:text-neutral-700 transition-colors">Sign out</button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-10 flex">
        <Link href="/concept" className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-neutral-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <span className="text-[10px] font-medium">Accounts</span>
        </Link>
        <Link href="/concept/board" className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-neutral-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
          <span className="text-[10px] font-medium">Signals</span>
        </Link>
        <Link href="/concept/workspace" className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-neutral-900">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
          <span className="text-[10px] font-semibold">Workspace</span>
        </Link>
      </nav>

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
          <div className="space-y-4">
            {FIELDS.map((field, i) => {
              const isFilled = !!(form[field.key] as string)?.trim()
              return (
                <div
                  key={field.key}
                  className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${isFilled ? "border-neutral-200 shadow-sm" : "border-neutral-200"}`}
                >
                  {/* Field header */}
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

                  {/* Staleness nudge for roadmapFocus */}
                  {field.key === "roadmapFocus" && isFilled && isRoadmapStale(workspaceUpdatedAt) && (
                    <div className="mx-5 mt-0 mb-0 mt-3">
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          Last updated in <span className="font-semibold">{getQuarterLabel(new Date(workspaceUpdatedAt!))}</span>. A new quarter has started — is this roadmap still current?
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Textarea */}
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

            <p className="text-xs text-neutral-400 text-center pt-2">
              Changes save automatically · context applies to all future analyses
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
