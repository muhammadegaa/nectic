"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { useAuth } from "@/contexts/auth-context"
import { getAccount, deleteAccount, type StoredAccount } from "@/lib/concept-firestore"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"

const riskConfig = {
  low: { label: "Low risk", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", score: "text-green-600" },
  medium: { label: "Medium risk", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", score: "text-amber-600" },
  high: { label: "High risk", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", score: "text-orange-600" },
  critical: { label: "Critical", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", score: "text-red-600" },
}

const signalTypeConfig: Record<string, { label: string; color: string }> = {
  complaint: { label: "Complaint", color: "bg-red-50 text-red-700 border-red-200" },
  feature_request: { label: "Feature request", color: "bg-blue-50 text-blue-700 border-blue-200" },
  praise: { label: "Praise", color: "bg-green-50 text-green-700 border-green-200" },
  confusion: { label: "Confusion", color: "bg-amber-50 text-amber-700 border-amber-200" },
}

const urgencyConfig = {
  immediate: { label: "Act now", color: "text-red-600 bg-red-50 border-red-200" },
  this_week: { label: "This week", color: "text-amber-700 bg-amber-50 border-amber-200" },
  this_month: { label: "This month", color: "text-neutral-600 bg-neutral-100 border-neutral-200" },
}

export default function AccountPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [account, setAccount] = useState<StoredAccount | null>(null)
  const [loadingAccount, setLoadingAccount] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/concept/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    getAccount(user.uid, id)
      .then(setAccount)
      .catch(console.error)
      .finally(() => setLoadingAccount(false))
  }, [user, id])

  const handleDelete = async () => {
    if (!user) return
    setDeleting(true)
    await deleteAccount(user.uid, id)
    router.push("/concept")
  }

  if (authLoading || !user || loadingAccount) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-neutral-500">Account not found.</p>
          <Link href="/concept" className="mt-3 inline-block text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b border-neutral-200 px-4 sm:px-6 h-12 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <LogoIcon size={20} />
            <span className="text-sm font-semibold text-neutral-900">Nectic</span>
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href="/concept" className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">Dashboard</Link>
          <span className="text-neutral-300">/</span>
          <span className="text-sm text-neutral-700 truncate max-w-32">{account.result.accountName}</span>
        </div>
        <div className="flex items-center gap-3">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Remove this account?</span>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-neutral-400 hover:text-neutral-700 px-2 py-1 transition-colors">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
              >
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-xs text-neutral-300 hover:text-red-500 transition-colors">Remove account</button>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <AnalysisReport result={account.result} fileName={account.fileName} analyzedAt={account.analyzedAt} />
      </main>
    </div>
  )
}

function AnalysisReport({
  result,
  fileName,
  analyzedAt,
}: {
  result: AnalysisResult
  fileName: string
  analyzedAt: string
}) {
  const risk = riskConfig[result.riskLevel] ?? riskConfig.medium
  const urgency = urgencyConfig[result.recommendedAction.urgency as keyof typeof urgencyConfig] ?? urgencyConfig.this_month
  const sentiment = {
    improving: { icon: "↗", text: "text-green-600", label: "Improving" },
    stable: { icon: "→", text: "text-neutral-500", label: "Stable" },
    declining: { icon: "↘", text: "text-red-500", label: "Declining" },
  }[result.sentimentTrend] ?? { icon: "→", text: "text-neutral-500", label: "Stable" }

  return (
    <div className="space-y-4">
      <div className={`border rounded-lg p-6 ${risk.bg} ${risk.border}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1">Account analysis</p>
            <h2 className="text-xl font-semibold text-neutral-900">{result.accountName}</h2>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed max-w-lg">{result.summary}</p>
          </div>
          <div className="flex-shrink-0 text-center">
            <p className={`text-5xl font-light ${risk.score}`}>{result.healthScore}</p>
            <p className="text-xs text-neutral-500 mt-1">/ 10</p>
            <span className={`mt-2 inline-block text-xs font-semibold px-3 py-1 rounded-full border ${risk.bg} ${risk.text} ${risk.border}`}>
              {risk.label}
            </span>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-4 flex-wrap pt-4 border-t border-black/5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`font-medium ${sentiment.text}`}>{sentiment.icon} {sentiment.label}</span>
            <span className="text-neutral-400">sentiment</span>
          </div>
          <span className="text-neutral-200">·</span>
          <span className="text-neutral-500">{result.stats?.messageCount} messages · {result.stats?.dateRange}</span>
          <span className="text-neutral-200">·</span>
          <div className="flex gap-1">
            {result.stats?.languages?.map((l) => (
              <span key={l} className="text-neutral-500 bg-white/60 border border-black/10 px-2 py-0.5 rounded-full">{l}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Recommended action</p>
            <p className="text-sm text-white leading-relaxed">{result.recommendedAction.what}</p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${urgency.color}`}>
              {urgency.label}
            </span>
            <span className="text-xs text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded">
              Owner: {result.recommendedAction.owner}
            </span>
          </div>
        </div>
      </div>

      {result.riskSignals?.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-800">Risk signals</p>
            <span className="text-xs text-neutral-400">{result.riskSignals.length} found</span>
          </div>
          <div className="divide-y divide-neutral-100">
            {result.riskSignals.map((s, i) => {
              const sev = s.severity === "high" ? "border-l-red-400" : s.severity === "medium" ? "border-l-amber-400" : "border-l-neutral-300"
              return (
                <div key={i} className={`p-5 border-l-4 ${sev}`}>
                  <div className="bg-neutral-50 rounded px-3 py-2 text-sm text-neutral-600 italic border border-neutral-100 mb-2">
                    &ldquo;{s.quote}&rdquo;
                    {s.date && <span className="ml-2 text-xs text-neutral-400 not-italic">{s.date}</span>}
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">{s.explanation}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {result.productSignals?.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-800">Product signals</p>
            <span className="text-xs text-neutral-400">{result.productSignals.length} found</span>
          </div>
          <div className="divide-y divide-neutral-100">
            {result.productSignals.map((s, i) => {
              const typeCfg = signalTypeConfig[s.type] ?? signalTypeConfig.complaint
              const priColor = s.priority === "high" ? "text-red-600" : s.priority === "medium" ? "text-amber-600" : "text-neutral-400"
              return (
                <div key={i} className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 border rounded-full ${typeCfg.color}`}>
                        {typeCfg.label}
                      </span>
                      <p className="text-sm font-semibold text-neutral-800">{s.title}</p>
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${priColor}`}>
                      {s.priority.charAt(0).toUpperCase() + s.priority.slice(1)} priority
                    </span>
                  </div>
                  <div className="bg-neutral-50 rounded px-3 py-2 text-sm text-neutral-600 italic border border-neutral-100 mb-2">
                    &ldquo;{s.quote}&rdquo;
                  </div>
                  <p className="text-xs text-neutral-500">
                    <span className="font-medium text-neutral-600">PM action:</span> {s.pmAction}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {result.relationshipSignals?.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100">
            <p className="text-sm font-semibold text-neutral-800">Relationship signals</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {result.relationshipSignals.map((s, i) => (
              <div key={i} className="p-5">
                <p className="text-sm font-medium text-neutral-700">{s.observation}</p>
                <p className="mt-1 text-xs text-neutral-500">{s.implication}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.competitorMentions?.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Competitors mentioned</p>
          <div className="flex gap-2 flex-wrap">
            {result.competitorMentions.map((c) => (
              <span key={c} className="text-sm font-medium text-neutral-700 bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-full">{c}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2 pb-8">
        <Link
          href="/concept"
          className="flex-1 border border-neutral-200 bg-white text-neutral-700 text-sm font-semibold py-3 rounded-lg hover:border-neutral-400 transition-colors text-center"
        >
          ← Back to dashboard
        </Link>
      </div>

      <p className="text-xs text-neutral-400 text-center pb-4">
        Analyzed {new Date(analyzedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {fileName}
      </p>
    </div>
  )
}
