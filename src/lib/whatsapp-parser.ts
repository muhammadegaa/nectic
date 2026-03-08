// ─── File ingestion (handles .txt and .zip) ───────────────────────────────────

export async function parseWhatsAppFile(file: File): Promise<WaParsed> {
  if (file.name.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed") {
    const JSZip = (await import("jszip")).default
    const zip = await JSZip.loadAsync(file)
    const chatFile = zip.file("_chat.txt") ?? zip.file(/\/_chat\.txt$/)[0] ?? zip.file(/chat\.txt$/i)[0]
    if (!chatFile) throw new Error("No _chat.txt found inside the ZIP. Try exporting again without media.")
    const raw = await chatFile.async("string")
    return parseWhatsAppExport(raw)
  }
  const raw = await file.text()
  return parseWhatsAppExport(raw)
}

export interface WaMessage {
  timestamp: string
  sender: string
  body: string
  isSystem: boolean
}

export interface WaParsed {
  messages: WaMessage[]
  participants: string[]
  dateRange: { from: string; to: string }
  totalMessages: number
  truncated: boolean
  samplingNote?: string // explains what was sampled when truncated
}

// Invisible Unicode characters WhatsApp injects into exports
const INVISIBLE_UNICODE = /[\u200e\u200f\u2068\u2069\u202a-\u202e]/g

// WhatsApp export line patterns — iOS uses brackets, Android uses dashes
const PATTERNS = [
  // [DD/MM/YYYY, HH:MM:SS] Sender: message  (iOS, folder export)
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*([^:]+):\s*(.*)/,
  // DD/MM/YYYY, HH:MM - Sender: message  (Android)
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.*)/,
  // DD/MM/YY, HH.MM - Sender: message  (some locales use dots)
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}\.\d{2})\s*-\s*([^:]+):\s*(.*)/,
]

const SYSTEM_KEYWORDS = [
  "messages and calls are end-to-end encrypted",
  "created group",
  "added you",
  "added ",
  "removed",
  " left",
  "changed the group",
  "changed this group",
  "security code changed",
  "joined using this group",
  "you were added",
  "this message was deleted",
  "missed voice call",
  "missed video call",
  // Bahasa Indonesia
  "pesan dan panggilan dienkripsi",
  "membuat grup",
  "menambahkan",
  "menghapus",
  "keluar dari grup",
  "bergabung menggunakan",
  "pesan ini dihapus",
  "panggilan suara tidak terjawab",
  "panggilan video tidak terjawab",
]

// Patterns to skip entirely (attachments, media)
const SKIP_BODY_PATTERNS = [
  /^<attached:/i,
  /^<Media omitted>/i,
  /^image omitted$/i,
  /^video omitted$/i,
  /^audio omitted$/i,
  /^document omitted$/i,
  /^sticker omitted$/i,
  /^GIF omitted$/i,
  /^Contact card omitted$/i,
  /^\(file attached\)$/i,
]

// ─── Signal detection (used for smart sampling of large conversations) ─────────

// Bahasa Indonesia signals: frustration, complaint, confusion, competitor, churn
const SIGNAL_KW_ID = [
  "masalah", "kendala", "tidak bisa", "nggak bisa", "gabisa", "gak bisa",
  "error", "bug", "eror", "down", "gangguan", "lambat", "lemot", "loading",
  "lama", "putus", "mati", "crash", "gagal", "susah", "ribet", "bingung",
  "kapan", "belum", "belum ada", "belum selesai", "masih belum", "masih error",
  "mau pindah", "coba yang lain", "bandingkan", "compare", "kompetitor",
  "lebih murah", "mahal", "tagihan", "bayar", "refund", "cancel", "berhenti",
  "tidak lanjut", "nggak lanjut", "kecewa", "kurang puas", "tidak puas",
  "nggak puas", "mengecewakan", "buruk", "jelek", "parah",
  "sudah lapor", "sudah report", "sudah bilang", "kok belum", "kenapa masih",
  "tolong", "mohon", "urgent", "segera", "asap",
]

// English signals
const SIGNAL_KW_EN = [
  "issue", "problem", "bug", "error", "broken", "crash", "slow", "can't",
  "cannot", "doesn't work", "not working", "failed", "failing", "down",
  "competitor", "alternative", "switch", "switching", "cancel", "refund",
  "leave", "churning", "disappointed", "frustrated", "unhappy", "terrible",
  "worse", "when will", "how long", "still not", "still broken", "still waiting",
  "urgent", "asap", "escalate", "unacceptable", "unprofessional",
  "mislead", "promised", "where is", "why hasn't", "nobody is",
]

// Known competitors in SEA SaaS space
const COMPETITORS = [
  "qontak", "zendesk", "freshdesk", "salesforce", "hubspot", "zoho", "pipedrive",
  "respond.io", "twilio", "intercom", "crisp", "tawk", "sendbird",
  "mekari", "talenta", "jurnal", "sleekr", "gadjian",
]

function isSignalMessage(msg: WaMessage): boolean {
  const b = msg.body.toLowerCase()
  if (SIGNAL_KW_ID.some((kw) => b.includes(kw))) return true
  if (SIGNAL_KW_EN.some((kw) => b.includes(kw))) return true
  if (COMPETITORS.some((kw) => b.includes(kw))) return true
  // Meaningful questions (exclude very short "?" messages)
  if (msg.body.includes("?") && msg.body.length > 25) return true
  return false
}

function cleanBody(raw: string): string {
  let s = raw.replace(INVISIBLE_UNICODE, "")
  s = s.replace(/<This message was edited>/gi, "").trim()
  s = s.replace(/https?:\/\/\S+/g, "[link]")
  s = s.replace(/@[^\s]+/g, (match) => match.replace(INVISIBLE_UNICODE, ""))
  return s.trim()
}

function cleanSender(raw: string): string {
  let s = raw.replace(INVISIBLE_UNICODE, "").trim()
  s = s.replace(/^~\s*/, "")
  return s.trim()
}

function isSystemBody(body: string, sender: string): boolean {
  const lowerBody = body.toLowerCase()
  const lowerSender = sender.toLowerCase()
  return SYSTEM_KEYWORDS.some(
    (kw) => lowerBody.includes(kw) || lowerSender.includes(kw)
  )
}

// ─── Smart sampling ───────────────────────────────────────────────────────────
//
// Strategy for large conversations:
//   1. Always include the most recent RECENT_COUNT messages (last N messages)
//      — recency matters most for active risk signals
//   2. From the full history, include signal-rich messages
//      — catches churn signals/complaints from months ago
//   3. Spread "context" samples across the full timeline for baseline sentiment
//   4. Hard cap at MAX_SAMPLE total messages
//
// This lets us analyze a 12-month, 3000-message group without losing signals.

const MAX_SAMPLE = 500
const RECENT_COUNT = 200 // always include last N messages in full

function smartSample(messages: WaMessage[]): { sampled: WaMessage[]; note: string } {
  if (messages.length <= MAX_SAMPLE) {
    return { sampled: messages, note: "" }
  }

  const recent = messages.slice(-RECENT_COUNT)
  const history = messages.slice(0, -RECENT_COUNT)

  // From history: take all signal messages first
  const signals = history.filter(isSignalMessage)

  // Fill remaining budget with evenly-spaced context messages
  const remaining = MAX_SAMPLE - RECENT_COUNT - signals.length
  let context: WaMessage[] = []
  if (remaining > 0 && history.length > 0) {
    const nonSignal = history.filter((m) => !isSignalMessage(m))
    if (nonSignal.length <= remaining) {
      context = nonSignal
    } else {
      const step = Math.floor(nonSignal.length / remaining)
      for (let i = 0; i < nonSignal.length && context.length < remaining; i += step) {
        context.push(nonSignal[i])
      }
    }
  }

  // Merge and sort by original index (maintain chronological order)
  const historySet = new Set([...signals, ...context])
  const historyMerged = history.filter((m) => historySet.has(m))

  const sampled = [...historyMerged, ...recent]

  const dateFrom = messages[0]?.timestamp ?? ""
  const dateTo = messages[messages.length - 1]?.timestamp ?? ""
  const note = `Analyzed ${sampled.length} of ${messages.length} total messages (full period: ${dateFrom} – ${dateTo}). Smart sampling: last ${recent.length} messages in full, plus ${signals.length} signal-rich + ${context.length} context messages from earlier history.`

  return { sampled, note }
}

// ─── Core parser ──────────────────────────────────────────────────────────────

export function parseWhatsAppExport(raw: string): WaParsed {
  // Normalise line endings and strip BOM
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/)
  const messages: WaMessage[] = []
  let current: WaMessage | null = null

  for (const rawLine of lines) {
    const line = rawLine.replace(INVISIBLE_UNICODE, "")
    let matched = false

    for (const pattern of PATTERNS) {
      const m = line.match(pattern)
      if (m) {
        if (current) messages.push(current)

        const [, date, time, rawSender, rawBody] = m
        const sender = cleanSender(rawSender)
        const body = cleanBody(rawBody)
        const isSystem = isSystemBody(body, sender) || isSystemBody(rawBody, rawSender)

        current = {
          timestamp: `${date} ${time}`.trim(),
          sender,
          body,
          isSystem,
        }
        matched = true
        break
      }
    }

    if (!matched && current && line.trim()) {
      const cont = cleanBody(line)
      if (cont) current.body += "\n" + cont
    }
  }

  if (current) messages.push(current)

  // Filter out system messages, empty bodies, media-only messages
  const real = messages.filter((m) => {
    if (m.isSystem) return false
    if (!m.body || m.body.length < 2) return false
    if (SKIP_BODY_PATTERNS.some((p) => p.test(m.body))) return false
    if (m.body.trim() === "[link]") return false
    return true
  })

  // Deduplicate consecutive identical messages from same sender
  const deduped = real.filter((m, i) => {
    if (i === 0) return true
    const prev = real[i - 1]
    return !(m.sender === prev.sender && m.body === prev.body)
  })

  const participants = [...new Set(deduped.map((m) => m.sender))].filter(Boolean)

  // Smart sampling: handles conversations of any size
  const { sampled, note } = smartSample(deduped)
  const truncated = deduped.length > sampled.length

  return {
    messages: sampled,
    participants,
    dateRange: {
      from: sampled[0]?.timestamp ?? "",
      to: sampled[sampled.length - 1]?.timestamp ?? "",
    },
    totalMessages: deduped.length,
    truncated,
    samplingNote: note || undefined,
  }
}

export function formatForPrompt(parsed: WaParsed): string {
  const header = parsed.samplingNote
    ? `[CONTEXT: ${parsed.samplingNote}]\n\n`
    : ""
  return header + parsed.messages
    .map((m) => `[${m.timestamp}] ${m.sender}: ${m.body}`)
    .join("\n")
}
