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
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <LogoIcon size={20} />
            <span className="text-sm font-semibold text-neutral-900">Nectic</span>
          </Link>
          <span className="text-neutral-200">·</span>
          <div className="flex items-center gap-3 text-xs">
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
