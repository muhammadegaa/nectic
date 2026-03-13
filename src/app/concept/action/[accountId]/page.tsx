"use client"

import { useEffect, useState, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import {
  getAccount,
  saveSignalAction,
  recalculateHealthFromResolutions,
  signalKey,
  getWorkspace,
  saveDraftExample,
  type StoredAccount,
  type WorkspaceContext,
} from "@/lib/concept-firestore"

const riskBadge: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const riskDot: Record<string, string> = {
  critical: "bg-red-500 animate-pulse",
  high: "bg-orange-400",
  medium: "bg-amber-400",
  low: "bg-emerald-400",
}

function ActionPageInner() {
  const params = useParams()
  const accountId = params.accountId as string
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [account, setAccount] = useState<StoredAccount | null>(null)
  const [workspace, setWorkspace] = useState<WorkspaceContext>({})
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState("")
  const [originalDraft, setOriginalDraft] = useState("")
  const [draftLoading, setDraftLoading] = useState(false)
  const [showEvidence, setShowEvidence] = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [doneMode, setDoneMode] = useState<"sent" | "copied">("sent")

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/concept/login?callbackUrl=/concept/action/${accountId}`)
    }
  }, [user, authLoading, accountId, router])

  useEffect(() => {
    if (!user) return
    Promise.all([getAccount(user.uid, accountId), getWorkspace(user.uid)])
      .then(([acc, ws]) => {
        setAccount(acc)
        setWorkspace(ws)
        // Pre-fill draft from top risk signal action if exists
        const topSignal = acc?.result.riskSignals?.[0]
        if (topSignal) {
          const t = (topSignal as { type?: string }).type ?? "risk"
          const title = (topSignal as { title?: string }).title || topSignal.explanation.slice(0, 80)
          const key = signalKey(t, title)
          const existing = acc?.signalActions?.[key]?.draftResponse
          if (existing) {
            setDraft(existing)
            setOriginalDraft(existing)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [user, accountId])

  const topSignal = account?.result.riskSignals?.[0]
  const topSignalType = topSignal ? ((topSignal as { type?: string }).type ?? "risk") : "risk"
  const topSignalTitle = topSignal
    ? ((topSignal as { title?: string }).title || topSignal.explanation.slice(0, 80))
    : ""
  const topSignalKey = topSignal ? signalKey(topSignalType, topSignalTitle) : ""
  const watiPhone = account?.context?.watiPhone
  const canSend = !!(watiPhone && draft.trim())

  const allEvidence = [
    ...(account?.result.riskSignals ?? []).flatMap((s) => {
      const title = (s as { title?: string }).title || s.explanation.slice(0, 60)
      const severity = (s as { severity?: string }).severity ?? "medium"
      const quotes = [s.quote, ...((s as { evidence?: string[] }).evidence ?? [])].filter(Boolean)
      return quotes.map((q, i) => ({ quote: q, label: title, tag: "risk" as const, severity, isFirst: i === 0 }))
    }),
  ]

  const generateDraft = async () => {
    if (!account || !topSignal) return
    setDraftLoading(true)
    try {
      const res = await fetch("/api/concept/draft-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalTitle: topSignalTitle,
          signalExplanation: topSignal.explanation,
          quote: topSignal.quote,
          signalCategory: "risk",
          accountName: account.result.accountName,
          workspace,
          accountContext: {
            summary: account.result.summary,
            sentimentTrend: account.result.sentimentTrend,
            riskLevel: account.result.riskLevel,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Draft failed")
      setDraft(data.draft)
      if (!originalDraft) setOriginalDraft(data.draft)
      // Save draft to Firestore
      if (user && topSignalKey) {
        await saveSignalAction(user.uid, accountId, topSignalKey, {
          status: "open",
          draftResponse: data.draft,
          updatedAt: new Date().toISOString(),
        })
      }
    } catch {
      toast.error("Could not generate draft. Try again.")
    } finally {
      setDraftLoading(false)
    }
  }

  const handleSend = async () => {
    if (!canSend || !user) return
    setSending(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jid: watiPhone, text: draft }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Send failed")

      const resolvedAt = new Date().toISOString()
      await saveSignalAction(user.uid, accountId, topSignalKey, {
        status: "done",
        draftResponse: draft,
        resolvedAt,
        updatedAt: resolvedAt,
      })
      await recalculateHealthFromResolutions(user.uid, accountId)
      if (originalDraft && draft !== originalDraft) {
        saveDraftExample(user.uid, originalDraft, draft, topSignalType).catch(() => {})
      }
      setDoneMode("sent")
      setDone(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send. Try again.")
    } finally {
      setSending(false)
    }
  }

  const handleCopyAndDone = async () => {
    if (!draft || !user) return
    await navigator.clipboard.writeText(draft)
    const resolvedAt = new Date().toISOString()
    await saveSignalAction(user.uid, accountId, topSignalKey, {
      status: "done",
      draftResponse: draft,
      resolvedAt,
      updatedAt: resolvedAt,
    })
    await recalculateHealthFromResolutions(user.uid, accountId)
    if (originalDraft && draft !== originalDraft) {
      saveDraftExample(user.uid, originalDraft, draft, topSignalType).catch(() => {})
    }
    setDoneMode("copied")
    setDone(true)
  }

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-sm text-neutral-500">Account not found.</p>
      </div>
    )
  }

  const risk = account.result.riskLevel

  // Done screen
  if (done) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>
        <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <p className="text-lg font-semibold text-neutral-900 mb-1">
            {doneMode === "sent" ? "Message sent" : "Copied to clipboard"}
          </p>
          <p className="text-sm text-neutral-500 mb-6">
            {account.result.accountName} · signal marked resolved
          </p>
          <button
            onClick={() => router.push("/concept/board")}
            className="text-xs font-medium text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            Back to inbox →
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Minimal header */}
      <div className="border-b border-neutral-200 bg-white px-5 py-3.5 flex items-center justify-between">
        <span className="text-sm font-bold tracking-tight text-neutral-900">nectic</span>
        <button
          onClick={() => router.push("/concept/board")}
          className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          Inbox →
        </button>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Account + risk */}
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full shrink-0 ${riskDot[risk] ?? "bg-neutral-300"}`} />
          <p className="text-base font-bold text-neutral-900 flex-1 truncate">{account.result.accountName}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 border rounded-full ${riskBadge[risk] ?? ""}`}>
            {risk}
          </span>
        </div>

        {/* Signal */}
        {topSignal && (
          <div className="bg-white border border-neutral-200 rounded-xl px-4 py-4 shadow-sm space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Signal detected</p>
              <p className="text-sm font-semibold text-neutral-900 leading-snug">{topSignalTitle}</p>
            </div>

            <p className="text-xs text-neutral-500 italic leading-relaxed border-l-2 border-neutral-200 pl-3">
              &ldquo;{topSignal.quote}&rdquo;
            </p>

            {topSignal.explanation && (
              <p className="text-xs text-neutral-500 leading-relaxed">{topSignal.explanation}</p>
            )}

            {/* Evidence toggle */}
            {allEvidence.length > 1 && (
              <div>
                <button
                  onClick={() => setShowEvidence((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className={`transition-transform ${showEvidence ? "rotate-90" : ""}`}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  {showEvidence ? "Hide" : "Show"} all evidence · {allEvidence.length} messages
                </button>
                <AnimatePresence>
                  {showEvidence && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2">
                        {allEvidence.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-neutral-200 flex-shrink-0 flex items-center justify-center mt-0.5">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                              </svg>
                            </div>
                            <div className="bg-neutral-100 rounded-2xl rounded-tl-sm px-3 py-2">
                              <p className="text-xs text-neutral-800 leading-relaxed">{item.quote}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Draft */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 border-b border-neutral-100">
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">Draft response</span>
            </div>
            {draft && (
              <button onClick={generateDraft} className="text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors">
                Regenerate
              </button>
            )}
          </div>

          <div className="px-4 py-3">
            {draftLoading ? (
              <div className="space-y-2">
                <div className="h-3 bg-neutral-100 rounded animate-pulse w-full" />
                <div className="h-3 bg-neutral-100 rounded animate-pulse w-4/5" />
                <div className="h-3 bg-neutral-100 rounded animate-pulse w-3/5" />
              </div>
            ) : draft ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                className="w-full text-sm text-neutral-800 leading-relaxed resize-none focus:outline-none bg-transparent"
              />
            ) : (
              <button
                onClick={generateDraft}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-neutral-500 py-4 hover:text-neutral-900 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Generate AI draft
              </button>
            )}
          </div>
        </div>

        {/* CTA buttons — sticky on mobile */}
        <div className="sticky bottom-0 pb-6 pt-2 bg-neutral-50">
          <div className="space-y-2">
            {canSend ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSend}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {sending ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Send via WhatsApp
                  </>
                )}
              </motion.button>
            ) : draft ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleCopyAndDone}
                className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-700 text-white text-sm font-semibold py-3.5 rounded-xl transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                Copy &amp; mark done
              </motion.button>
            ) : null}

            {!canSend && draft && (
              <p className="text-center text-[11px] text-neutral-400">
                Connect WhatsApp in{" "}
                <a href="/concept/workspace" className="underline hover:text-neutral-700">workspace settings</a>{" "}
                to send directly.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ActionPage() {
  return (
    <Suspense>
      <ActionPageInner />
    </Suspense>
  )
}
