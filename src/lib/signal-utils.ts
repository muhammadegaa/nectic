// Pure utilities shared between client and server — no Firebase, no "use client"

export type SignalActionStatus = "open" | "in_progress" | "done" | "dismissed"

// Why a signal was marked done — feeds the closed feedback loop
export type ResolvedReason =
  | "customer_confirmed"  // customer said issue resolved
  | "issue_fixed"         // we shipped the fix
  | "workaround_given"    // gave customer a workaround
  | "false_positive"      // agent was wrong, not a real risk
  | "no_action_needed"    // signal existed but needed no response

export interface SignalAction {
  status: SignalActionStatus
  note?: string
  draftResponse?: string
  resolvedAt?: string
  resolvedReason?: ResolvedReason
  updatedAt: string
}

export function signalKey(type: string, title: string): string {
  return `${type}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`
}

export function buildSignalActionsBlock(
  signalActions: Record<string, SignalAction> | undefined,
  result: {
    riskSignals?: { title?: string; explanation: string; type?: string }[]
    productSignals?: { type: string; title: string }[]
  }
): string {
  if (!signalActions || Object.keys(signalActions).length === 0) return ""
  const allSignals = [
    ...(result.riskSignals ?? []).map((s) => ({
      type: s.type ?? "risk",
      // Use dedicated title when available (new analyses), fall back to explanation slice for old records
      title: s.title || s.explanation.slice(0, 80),
    })),
    ...(result.productSignals ?? []).map((s) => ({
      type: s.type,
      title: s.title,
    })),
  ]
  const lines: string[] = []
  for (const [key, action] of Object.entries(signalActions)) {
    const match = allSignals.find((s) => signalKey(s.type, s.title) === key)
    const label = match ? `[${match.type}] "${match.title}"` : `[signal] ${key}`
    const notePart = action.note ? `. Note: "${action.note}"` : ""
    const reasonPart = action.resolvedReason ? ` [reason: ${action.resolvedReason}]` : ""
    lines.push(`- ${label} → Status: ${action.status}${reasonPart}${notePart}`)
  }
  if (!lines.length) return ""
  return `\nPRIOR ACTIONS ON SIGNALS:\n${lines.join("\n")}\n`
}
