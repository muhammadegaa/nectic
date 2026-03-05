"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { useAuth } from "@/contexts/auth-context"
import { getWorkspace, saveWorkspace, type WorkspaceContext } from "@/lib/concept-firestore"

export default function WorkspacePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState<WorkspaceContext>({
    productDescription: "",
    featureAreas: "",
    roadmapFocus: "",
    knownIssues: "",
    watiEndpoint: "",
    watiToken: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/concept/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    getWorkspace(user.uid).then((ws) => {
      setForm({
        productDescription: ws.productDescription ?? "",
        featureAreas: ws.featureAreas ?? "",
        roadmapFocus: ws.roadmapFocus ?? "",
        knownIssues: ws.knownIssues ?? "",
        watiEndpoint: ws.watiEndpoint ?? "",
        watiToken: ws.watiToken ?? "",
      })
      setLoading(false)
    })
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await saveWorkspace(user.uid, form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const [watiTokenVisible, setWatiTokenVisible] = useState(false)
  const hasContent = Object.values(form).some((v) => v?.trim())

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
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="hidden sm:block">{user.displayName ?? user.email}</span>
          <button onClick={() => signOut()} className="hover:text-neutral-700 transition-colors">Sign out</button>
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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-24 sm:pb-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-neutral-900">Workspace</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Tell Nectic about your product. This context is injected into every analysis, re-analysis, brief, and chat — the more specific you are, the more useful the output.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <Field
              label="What your product does"
              hint="Who it serves, what problem it solves, the market. 2–3 sentences."
              placeholder="e.g. We build an HR SaaS for SMEs in Indonesia — payroll, attendance, and leave management for companies with 20–500 employees. Our customers are HR managers and finance teams who previously ran everything in spreadsheets."
              value={form.productDescription ?? ""}
              onChange={(v) => setForm({ ...form, productDescription: v })}
              rows={4}
            />
            <Field
              label="Main feature areas"
              hint="Your product's core modules or capabilities, comma-separated."
              placeholder="e.g. Payroll processing, attendance tracking, leave management, reimbursement, approval workflows, HR analytics, employee self-service"
              value={form.featureAreas ?? ""}
              onChange={(v) => setForm({ ...form, featureAreas: v })}
              rows={2}
            />
            <Field
              label="Roadmap this quarter"
              hint="What your team is actively building or shipping. Be specific — Nectic uses this to distinguish blind spots from work already in progress."
              placeholder="e.g. Mobile app for employees (approval + leave), bulk payroll import from Excel, BPJS integration, multi-level approval chains"
              value={form.roadmapFocus ?? ""}
              onChange={(v) => setForm({ ...form, roadmapFocus: v })}
              rows={3}
            />
            <Field
              label="Known issues"
              hint="Bugs, limitations, or pain points your team already knows about. Nectic won't surface these as new discoveries."
              placeholder="e.g. Report generation is slow for accounts with 200+ employees. Overtime calculation has an edge case with split shifts. Mobile push notifications unreliable on Android 13."
              value={form.knownIssues ?? ""}
              onChange={(v) => setForm({ ...form, knownIssues: v })}
              rows={3}
            />

            {/* WATI Integration */}
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <div className="bg-[#25D366]/8 border-b border-neutral-200 px-5 py-4 flex items-center gap-3">
                <div className="w-7 h-7 bg-[#25D366] rounded-lg flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.132.558 4.13 1.534 5.865L.054 23.454l5.787-1.517A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-4.994-1.368l-.358-.213-3.715.973.99-3.615-.234-.371A9.827 9.827 0 012.182 12C2.182 6.573 6.573 2.182 12 2.182c5.427 0 9.818 4.391 9.818 9.818 0 5.427-4.391 9.818-9.818 9.818z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">WATI Integration</p>
                  <p className="text-xs text-neutral-500">Connect your WATI account to import conversations directly — no manual export needed.</p>
                </div>
                {form.watiEndpoint && form.watiToken && (
                  <span className="ml-auto text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">Connected</span>
                )}
              </div>
              <div className="px-5 py-4 space-y-4 bg-white">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">API Endpoint</label>
                  <input
                    type="text"
                    value={form.watiEndpoint ?? ""}
                    onChange={(e) => setForm({ ...form, watiEndpoint: e.target.value })}
                    placeholder="https://eu-app-api.wati.io"
                    className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-white"
                  />
                  <p className="text-xs text-neutral-400 mt-1">Found in WATI Settings → API → Endpoint URL</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Access Token</label>
                  <div className="relative">
                    <input
                      type={watiTokenVisible ? "text" : "password"}
                      value={form.watiToken ?? ""}
                      onChange={(e) => setForm({ ...form, watiToken: e.target.value })}
                      placeholder="Bearer token from WATI Settings → API"
                      className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 pr-20 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setWatiTokenVisible(!watiTokenVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600"
                    >
                      {watiTokenVisible ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Found in WATI Settings → API → Access Token. Stored securely in your account.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={!hasContent || saving}
                className="bg-neutral-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : saved ? "Saved" : "Save workspace"}
              </button>
              {saved && (
                <span className="text-xs text-green-600 font-medium">All analyses will now use this context.</span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function Field({
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
    <div>
      <label className="block text-sm font-semibold text-neutral-800 mb-1">{label}</label>
      <p className="text-xs text-neutral-400 mb-2 leading-relaxed">{hint}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full text-sm border border-neutral-200 rounded-lg px-4 py-3 text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 bg-white resize-none leading-relaxed"
      />
    </div>
  )
}
