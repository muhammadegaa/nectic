"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { useAuth } from "@/contexts/auth-context"
import { parseWhatsAppFile, formatForPrompt, type WaParsed } from "@/lib/whatsapp-parser"
import {
  getAccounts,
  saveAccount,
  deleteAccount,
  aggregateSignals,
  prefillFromContactBook,
  mergeContactBook,
  type StoredAccount,
  type AccountContext,
  type ParticipantRole,
  type ParticipantRoles,
} from "@/lib/concept-firestore"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"

type ConnectStage = "instructions" | "upload" | "ready" | "analyzing" | "error"

const INDUSTRIES = ["SaaS / Software", "Fintech", "Logistics", "HR Tech", "E-commerce", "Healthcare", "Education", "Other"]
const CONTRACT_TIERS = [
  { value: "starter", label: "Starter  (<$500/mo)" },
  { value: "growth", label: "Growth  ($500–2k/mo)" },
  { value: "enterprise", label: "Enterprise  (>$2k/mo)" },
]

const riskConfig = {
  low: { label: "Low", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  medium: { label: "Medium", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  high: { label: "High", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  critical: { label: "Critical", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
}

const signalTypeConfig: Record<string, { label: string; color: string }> = {
  complaint: { label: "Complaint", color: "bg-red-50 text-red-700 border-red-200" },
  feature_request: { label: "Feature request", color: "bg-blue-50 text-blue-700 border-blue-200" },
  praise: { label: "Praise", color: "bg-green-50 text-green-700 border-green-200" },
  confusion: { label: "Confusion", color: "bg-amber-50 text-amber-700 border-amber-200" },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function WhatsAppIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConceptPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [showConnect, setShowConnect] = useState(false)
  const [connectStage, setConnectStage] = useState<ConnectStage>("instructions")
  const [parsed, setParsed] = useState<WaParsed | null>(null)
  const [fileName, setFileName] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [dragging, setDragging] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [participantRoles, setParticipantRoles] = useState<ParticipantRoles>({})
  const [context, setContext] = useState<AccountContext>({})
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/concept/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    setLoadingAccounts(true)
    getAccounts(user.uid)
      .then(setAccounts)
      .catch(console.error)
      .finally(() => setLoadingAccounts(false))
  }, [user])

  const refreshAccounts = async () => {
    if (!user) return
    const updated = await getAccounts(user.uid)
    setAccounts(updated)
  }

  const openConnect = () => {
    setConnectStage("instructions")
    setParsed(null)
    setFileName("")
    setUploadError("")
    setParticipantRoles({})
    setContext({})
    setShowConnect(true)
  }

  const closeConnect = () => {
    setShowConnect(false)
    setTimeout(() => {
      setConnectStage("instructions")
      setParsed(null)
      setFileName("")
      setUploadError("")
      setParticipantRoles({})
      setContext({})
      if (inputRef.current) inputRef.current.value = ""
    }, 200)
  }

  const handleFile = useCallback(async (file: File) => {
    const isValid = file.name.endsWith(".txt") || file.name.endsWith(".zip") ||
      file.type === "text/plain" || file.type === "application/zip" || file.type === "application/x-zip-compressed"
    if (!isValid) {
      setUploadError("Please upload a WhatsApp .txt export or .zip folder.")
      setConnectStage("error")
      return
    }
    setFileName(file.name)
    try {
      const p = await parseWhatsAppFile(file)
      if (p.messages.length < 5) {
        setUploadError("Couldn't parse this file. Make sure it's a WhatsApp chat export.")
        setConnectStage("error")
        return
      }
      setParsed(p)
      const prefilled = user
        ? await prefillFromContactBook(user.uid, p.participants)
        : p.participants.reduce<ParticipantRoles>((acc, n) => ({ ...acc, [n]: "other" }), {})
      setParticipantRoles(prefilled)
      setConnectStage("ready")
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to read file.")
      setConnectStage("error")
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const setRole = (name: string, role: ParticipantRole) => {
    setParticipantRoles((prev) => ({ ...prev, [name]: role }))
  }

  const analyze = async () => {
    if (!parsed || !user) return
    setConnectStage("analyzing")
    setUploadError("")

    try {
      const conversation = formatForPrompt(parsed)
      const res = await fetch("/api/concept/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation,
          messageCount: parsed.totalMessages,
          participants: parsed.participants.length,
          participantRoles,
          context,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Analysis failed")

      const shareToken = crypto.randomUUID()
      await saveAccount(user.uid, {
        fileName,
        analyzedAt: new Date().toISOString(),
        result: data.result as AnalysisResult,
        participantRoles,
        context,
        shareToken,
      })
      await mergeContactBook(user.uid, participantRoles)

      await refreshAccounts()
      closeConnect()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setUploadError(message)
      setConnectStage("error")
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    await deleteAccount(user.uid, id)
    setDeletingId(null)
    await refreshAccounts()
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  const aggregated = aggregateSignals(accounts)
  const atRisk = accounts.filter((a) => a.result.riskLevel === "high" || a.result.riskLevel === "critical").length
  const sharedSignals = aggregated.filter((s) => s.accountCount > 1).length

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b border-neutral-200 px-4 sm:px-6 h-12 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <LogoIcon size={20} />
          <span className="text-sm font-semibold text-neutral-900">Nectic</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full font-medium">Early access</span>
          {accounts.length > 0 && !loadingAccounts && (
            <button onClick={openConnect} className="flex items-center gap-1.5 text-xs bg-neutral-900 text-white px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors font-medium">
              <WhatsAppIcon size={12} />
              Connect account
            </button>
          )}
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
            <span className="text-xs text-neutral-500 hidden sm:block">{user.displayName ?? user.email}</span>
            <button onClick={() => signOut()} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">Sign out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loadingAccounts ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {accounts.length === 0 && <EmptyState onConnect={openConnect} userName={user.displayName?.split(" ")[0] ?? null} />}
            {accounts.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-white border border-neutral-200 rounded-lg p-5">
                    <p className="text-3xl font-light text-neutral-900">{accounts.length}</p>
                    <p className="text-xs text-neutral-500 mt-1">accounts connected</p>
                  </div>
                  <div className={`border rounded-lg p-5 ${atRisk > 0 ? "bg-red-50 border-red-200" : "bg-white border-neutral-200"}`}>
                    <p className={`text-3xl font-light ${atRisk > 0 ? "text-red-600" : "text-neutral-900"}`}>{atRisk}</p>
                    <p className={`text-xs mt-1 ${atRisk > 0 ? "text-red-500" : "text-neutral-500"}`}>at high / critical risk</p>
                  </div>
                  <div className={`border rounded-lg p-5 ${sharedSignals > 0 ? "bg-blue-50 border-blue-200" : "bg-white border-neutral-200"}`}>
                    <p className={`text-3xl font-light ${sharedSignals > 0 ? "text-blue-600" : "text-neutral-900"}`}>{sharedSignals}</p>
                    <p className={`text-xs mt-1 ${sharedSignals > 0 ? "text-blue-600" : "text-neutral-500"}`}>
                      {sharedSignals > 0 ? "signals across accounts" : "shared signals (add more)"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 space-y-3">
                    <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Connected accounts</h2>
                    {accounts.map((account) => (
                      <AccountCard
                        key={account.id}
                        account={account}
                        onDelete={() => setDeletingId(account.id)}
                        confirmingDelete={deletingId === account.id}
                        onConfirmDelete={() => handleDelete(account.id)}
                        onCancelDelete={() => setDeletingId(null)}
                      />
                    ))}
                  </div>
                  <div className="lg:col-span-2">
                    <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Product signals</h2>
                    <CrossAccountSignals signals={aggregated} accountCount={accounts.length} />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>

      {showConnect && (
        <ConnectModal
          stage={connectStage}
          parsed={parsed}
          fileName={fileName}
          error={uploadError}
          dragging={dragging}
          inputRef={inputRef}
          participantRoles={participantRoles}
          context={context}
          onClose={closeConnect}
          onContinueToUpload={() => setConnectStage("upload")}
          onBackToInstructions={() => setConnectStage("instructions")}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onFileSelect={() => inputRef.current?.click()}
          onInputChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          onSetRole={setRole}
          onContextChange={setContext}
          onAnalyze={analyze}
          onRetry={() => { setConnectStage("upload"); setUploadError(""); if (inputRef.current) inputRef.current.value = "" }}
        />
      )}
    </div>
  )
}

// ─── Connect modal ─────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: ParticipantRole; label: string; color: string }[] = [
  { value: "other", label: "Unknown", color: "text-neutral-400" },
  { value: "vendor", label: "My team", color: "text-neutral-700" },
  { value: "customer", label: "Customer", color: "text-blue-700" },
  { value: "partner", label: "Partner / Reseller", color: "text-purple-700" },
]

const ROLE_BADGE: Record<ParticipantRole, string> = {
  vendor: "bg-neutral-900 text-white",
  customer: "bg-blue-600 text-white",
  partner: "bg-purple-600 text-white",
  other: "bg-neutral-100 text-neutral-400 border border-neutral-200",
}

const ROLE_LABEL: Record<ParticipantRole, string> = {
  vendor: "My team",
  customer: "Customer",
  partner: "Partner",
  other: "?",
}

function ConnectModal({
  stage, parsed, fileName, error, dragging, inputRef,
  participantRoles, context,
  onClose, onContinueToUpload, onBackToInstructions,
  onDrop, onDragOver, onDragLeave, onFileSelect, onInputChange,
  onSetRole, onContextChange, onAnalyze, onRetry,
}: {
  stage: ConnectStage
  parsed: WaParsed | null
  fileName: string
  error: string
  dragging: boolean
  inputRef: React.RefObject<HTMLInputElement>
  participantRoles: ParticipantRoles
  context: AccountContext
  onClose: () => void
  onContinueToUpload: () => void
  onBackToInstructions: () => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onFileSelect: () => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSetRole: (name: string, role: ParticipantRole) => void
  onContextChange: (ctx: AccountContext) => void
  onAnalyze: () => void
  onRetry: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={stage === "analyzing" ? undefined : onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#25D366] rounded-lg flex items-center justify-center">
                <WhatsAppIcon size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Connect WhatsApp account</p>
                <p className="text-xs text-neutral-400">
                  {stage === "instructions" && "Export a group chat to get started"}
                  {stage === "upload" && "Drop your export file"}
                  {stage === "ready" && "Review before analysis"}
                  {stage === "analyzing" && "Analysing with Claude…"}
                  {stage === "error" && "Something went wrong"}
                </p>
              </div>
            </div>
            {stage !== "analyzing" && (
              <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 transition-colors text-xl leading-none">×</button>
            )}
          </div>

          {/* Body — scrollable */}
          <div className="overflow-y-auto flex-1 px-6 py-5">

            {stage === "instructions" && (
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">How to export</p>
                <div className="space-y-4">
                  <Step number={1} title="Open the WhatsApp group" description="The group chat between your team and the customer account." />
                  <Step number={2} title='Tap ⋮ → "More" → "Export chat"' description='iOS: tap the group name → "Export Chat". Android: tap ⋮ → "More" → "Export chat".' />
                  <Step number={3} title='"Without media" only' description="Select without media — text only. This keeps the file small." />
                  <Step number={4} title="Upload the file or ZIP" description="Save to Files and drop it here. Both .txt and .zip folder exports are accepted." />
                </div>
                <button onClick={onContinueToUpload} className="mt-6 w-full bg-neutral-900 text-white text-sm font-semibold py-3 rounded-lg hover:bg-neutral-700 transition-colors">
                  I have the file →
                </button>
                <p className="mt-3 text-center text-xs text-neutral-400">Files are processed in memory — never stored on our servers</p>
              </div>
            )}

            {stage === "upload" && (
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Upload export file</p>
                <div
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragging ? "border-[#25D366] bg-green-50" : "border-neutral-200 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100"}`}
                  onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={onFileSelect}
                >
                  <input ref={inputRef} type="file" accept=".txt,.zip,text/plain,application/zip" className="hidden" onChange={onInputChange} />
                  <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <WhatsAppIcon size={20} className="text-neutral-400" />
                  </div>
                  <p className="text-sm font-medium text-neutral-700">Drop your export here</p>
                  <p className="mt-1 text-xs text-neutral-400">.txt file or .zip folder — both accepted</p>
                </div>
                <button onClick={onBackToInstructions} className="mt-3 text-xs text-neutral-400 hover:text-neutral-600 transition-colors">← Back to instructions</button>
              </div>
            )}

            {stage === "ready" && parsed && (
              <div className="space-y-5">
                {/* Parsed stats */}
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">File parsed</p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-[#25D366] rounded flex items-center justify-center flex-shrink-0">
                        <WhatsAppIcon size={13} className="text-white" />
                      </div>
                      <p className="text-sm font-semibold text-neutral-900 truncate">{fileName}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white rounded-lg py-2 px-1 border border-green-100">
                        <p className="text-lg font-light text-neutral-900">{parsed.totalMessages}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">messages</p>
                      </div>
                      <div className="bg-white rounded-lg py-2 px-1 border border-green-100">
                        <p className="text-lg font-light text-neutral-900">{parsed.participants.length}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">participants</p>
                      </div>
                      <div className="bg-white rounded-lg py-2 px-1 border border-green-100">
                        <p className="text-xs font-medium text-neutral-900 mt-1">{parsed.dateRange.from.split(" ")[0]}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">from</p>
                      </div>
                    </div>
                    {parsed.truncated && (
                      <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
                        Large file — analysing the most recent {parsed.messages.length} messages.
                      </p>
                    )}
                  </div>
                </div>

                {/* Participant labelling */}
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">Who&apos;s who</p>
                  <p className="text-xs text-neutral-500 mb-3">
                    Label every participant — Nectic analyses only the non-vendor voice. Supports multi-party chats.
                  </p>
                  <div className="space-y-2">
                    {parsed.participants.map((name) => {
                      const role = participantRoles[name] ?? "other"
                      return (
                        <div key={name} className="flex items-center gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_BADGE[role]}`}>
                              {ROLE_LABEL[role]}
                            </span>
                            <span className="text-xs text-neutral-700 truncate font-medium">{name}</span>
                          </div>
                          <select
                            value={role}
                            onChange={(e) => onSetRole(name, e.target.value as ParticipantRole)}
                            className="text-xs border border-neutral-200 rounded-lg px-2 py-1 text-neutral-700 bg-white focus:outline-none focus:border-neutral-400 flex-shrink-0"
                          >
                            {ROLE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    {Object.values(participantRoles).filter((r) => r === "other").length > 0
                      ? `${Object.values(participantRoles).filter((r) => r === "other").length} unlabelled — you can skip, but labelling improves accuracy.`
                      : "All participants labelled."}
                  </p>
                </div>

                {/* Account context */}
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">Account context <span className="normal-case font-normal text-neutral-400">(optional)</span></p>
                  <p className="text-xs text-neutral-500 mb-3">Helps Nectic score urgency and risk more accurately.</p>
                  <div className="space-y-2.5">
                    <select
                      value={context.industry ?? ""}
                      onChange={(e) => onContextChange({ ...context, industry: e.target.value || undefined })}
                      className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 focus:outline-none focus:border-neutral-400 bg-white"
                    >
                      <option value="">Industry (optional)</option>
                      {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <select
                      value={context.contractTier ?? ""}
                      onChange={(e) => onContextChange({ ...context, contractTier: e.target.value as AccountContext["contractTier"] || undefined })}
                      className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 focus:outline-none focus:border-neutral-400 bg-white"
                    >
                      <option value="">Contract tier (optional)</option>
                      {CONTRACT_TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <input
                      type="month"
                      value={context.renewalMonth ?? ""}
                      onChange={(e) => onContextChange({ ...context, renewalMonth: e.target.value || undefined })}
                      className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 text-neutral-700 focus:outline-none focus:border-neutral-400 bg-white"
                      placeholder="Renewal month (optional)"
                    />
                  </div>
                </div>
              </div>
            )}

            {stage === "analyzing" && (
              <div className="py-8 text-center">
                <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-semibold text-neutral-900">Analysing {parsed?.totalMessages} messages</p>
                <p className="mt-1 text-xs text-neutral-400">Claude Sonnet 4.6 · ~20 seconds</p>
                <div className="mt-5 space-y-2 text-left">
                  {["Identifying customer voice…", "Extracting risk signals…", "Clustering product signals…", "Scoring account health…"].map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-pulse" style={{ animationDelay: `${i * 350}ms` }} />
                      <p className="text-xs text-neutral-500">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stage === "error" && (
              <div className="py-4 text-center">
                <p className="text-sm font-semibold text-neutral-900 mb-2">Something went wrong</p>
                <p className="text-xs text-red-600 mb-5">{error}</p>
                <button onClick={onRetry} className="w-full bg-neutral-900 text-white text-sm font-semibold py-3 rounded-lg hover:bg-neutral-700 transition-colors">Try again</button>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          {stage === "ready" && (
            <div className="px-6 py-4 border-t border-neutral-100 flex-shrink-0 space-y-2">
              <p className="text-xs text-neutral-400 leading-relaxed">
                By continuing, you confirm you have the right to share these conversations for analysis. Conversation text is sent to Anthropic for processing and stored securely. <a href="/privacy" target="_blank" className="underline hover:text-neutral-600 transition-colors">Privacy policy</a>
              </p>
              <button onClick={onAnalyze} className="w-full bg-neutral-900 text-white text-sm font-semibold py-3 rounded-lg hover:bg-neutral-700 transition-colors">
                Run analysis →
              </button>
              <button onClick={onRetry} className="w-full text-xs text-neutral-400 hover:text-neutral-600 transition-colors py-1">
                Use a different file
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Step component ────────────────────────────────────────────────────────────

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{number}</div>
      <div>
        <p className="text-sm font-semibold text-neutral-800">{title}</p>
        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ─── Account card ─────────────────────────────────────────────────────────────

function AccountCard({ account, onDelete, confirmingDelete, onConfirmDelete, onCancelDelete }: {
  account: StoredAccount; onDelete: () => void; confirmingDelete: boolean; onConfirmDelete: () => void; onCancelDelete: () => void
}) {
  const risk = riskConfig[account.result.riskLevel] ?? riskConfig.medium
  const topRisk = account.result.riskSignals?.[0]
  const topProduct = account.result.productSignals?.[0]
  const hasChanges = !!account.result.changesSince

  return (
    <div className={`bg-white border rounded-lg overflow-hidden transition-shadow hover:shadow-sm ${confirmingDelete ? "border-red-300" : "border-neutral-200"}`}>
      <Link href={`/concept/account/${account.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <div className="w-5 h-5 bg-[#25D366] rounded flex items-center justify-center flex-shrink-0">
                <WhatsAppIcon size={11} className="text-white" />
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${risk.bg} ${risk.text} ${risk.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                {risk.label} risk
              </span>
              {hasChanges && (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Updated</span>
              )}
            </div>
            <p className="text-sm font-semibold text-neutral-900 truncate">{account.result.accountName}</p>
            {topRisk && <p className="mt-1.5 text-xs text-neutral-500 line-clamp-1 italic">&ldquo;{topRisk.quote}&rdquo;</p>}
            {!topRisk && topProduct && <p className="mt-1.5 text-xs text-neutral-500 line-clamp-1">{topProduct.title}</p>}
          </div>
          <div className="flex-shrink-0 text-right">
            <p className={`text-2xl font-light ${risk.text}`}>{account.result.healthScore}</p>
            <p className="text-xs text-neutral-400">/ 10</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-neutral-400 border-t border-neutral-100 pt-3 flex-wrap">
          <span>{account.result.stats?.messageCount ?? "?"} messages</span>
          <span>·</span>
          <span>{account.result.riskSignals?.length ?? 0} risk signals</span>
          <span>·</span>
          <span>{timeAgo(account.updatedAt ?? account.analyzedAt)}</span>
          {account.context?.industry && <><span>·</span><span>{account.context.industry}</span></>}
        </div>
      </Link>
      {confirmingDelete ? (
        <div className="px-5 py-3 bg-red-50 border-t border-red-200 flex items-center justify-between gap-3">
          <p className="text-xs text-red-700">Remove this account?</p>
          <div className="flex gap-2">
            <button onClick={onCancelDelete} className="text-xs text-neutral-500 hover:text-neutral-700 px-2 py-1">Cancel</button>
            <button onClick={onConfirmDelete} className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors">Remove</button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-2 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <WhatsAppIcon size={10} className="text-neutral-300" />
            <span>{account.fileName}</span>
          </div>
          <button onClick={(e) => { e.preventDefault(); onDelete() }} className="text-xs text-neutral-300 hover:text-red-500 transition-colors">Remove</button>
        </div>
      )}
    </div>
  )
}

// ─── Cross-account signals ─────────────────────────────────────────────────────

function CrossAccountSignals({ signals, accountCount }: { signals: ReturnType<typeof aggregateSignals>; accountCount: number }) {
  if (signals.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
        <p className="text-sm text-neutral-400">No product signals extracted yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {accountCount < 2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-xs text-blue-700 leading-relaxed">Connect more accounts to see which problems appear across your customer base.</p>
        </div>
      )}
      {signals.map((sig, i) => {
        const typeCfg = signalTypeConfig[sig.type] ?? signalTypeConfig.complaint
        const isShared = sig.accountCount > 1
        return (
          <div key={i} className={`bg-white border rounded-lg p-4 ${isShared ? "border-blue-200 bg-blue-50/30" : "border-neutral-200"}`}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-xs font-semibold text-neutral-800 leading-snug">{sig.problemStatement || sig.title}</p>
              {isShared && (
                <span className="flex-shrink-0 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">{sig.accountCount} accounts</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs font-medium px-2 py-0.5 border rounded-full ${typeCfg.color}`}>{typeCfg.label}</span>
              {sig.priority === "high" && <span className="text-xs text-red-600 font-medium">High priority</span>}
            </div>
            {isShared && <p className="text-xs text-neutral-500 mb-1">{sig.accountNames.join(", ")}</p>}
            <p className="text-xs text-neutral-500 leading-relaxed">{sig.pmAction}</p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onConnect, userName }: { onConnect: () => void; userName: string | null }) {
  return (
    <div className="max-w-md mx-auto pt-16 text-center">
      <div className="w-14 h-14 bg-[#25D366] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
        <WhatsAppIcon size={28} className="text-white" />
      </div>
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">
        {userName ? `Welcome, ${userName}` : "Account Intelligence"}
      </p>
      <h1 className="text-3xl font-light text-neutral-900 tracking-tight">
        What are your customers<br /><span className="text-neutral-400">actually telling you?</span>
      </h1>
      <p className="mt-4 text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">
        Connect a WhatsApp account group to extract churn signals, product pain points, and patterns your team would never catch manually.
      </p>
      <button onClick={onConnect} className="mt-8 flex items-center gap-2 bg-neutral-900 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-neutral-700 transition-colors mx-auto">
        <WhatsAppIcon size={14} className="text-white" />
        Connect first account
      </button>
      <p className="mt-4 text-xs text-neutral-400">Works with .txt and .zip exports · Bahasa Indonesia + English · Processed in memory only</p>
    </div>
  )
}
