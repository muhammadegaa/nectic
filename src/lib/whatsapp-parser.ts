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
}

// Invisible Unicode characters WhatsApp injects into exports
// \u200e = Left-to-Right Mark, \u200f = Right-to-Left Mark
// \u2068 = First Strong Isolate, \u2069 = Pop Directional Isolate
// \u202a-\u202e = directional formatting characters
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

function cleanBody(raw: string): string {
  let s = raw.replace(INVISIBLE_UNICODE, "")

  // Strip the "<This message was edited>" marker
  s = s.replace(/<This message was edited>/gi, "").trim()

  // Replace URLs with [link] to save tokens and reduce noise
  s = s.replace(/https?:\/\/\S+/g, "[link]")

  // Clean @ mentions: @⁨Name⁩ → @Name
  s = s.replace(/@[^\s]+/g, (match) => match.replace(INVISIBLE_UNICODE, ""))

  return s.trim()
}

function cleanSender(raw: string): string {
  // Strip invisible Unicode
  let s = raw.replace(INVISIBLE_UNICODE, "").trim()
  // Strip leading ~ (contacts not saved in phonebook)
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

export function parseWhatsAppExport(raw: string, maxMessages = 250): WaParsed {
  // Normalise line endings and strip BOM
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/)
  const messages: WaMessage[] = []
  let current: WaMessage | null = null

  for (const rawLine of lines) {
    // Strip invisible Unicode from the whole line before pattern matching
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

    // Continuation line (multi-line message)
    if (!matched && current && line.trim()) {
      const cont = cleanBody(line)
      if (cont) current.body += "\n" + cont
    }
  }

  if (current) messages.push(current)

  // Filter: no system messages, no empty/skipped bodies
  const real = messages.filter((m) => {
    if (m.isSystem) return false
    if (!m.body || m.body.length < 2) return false
    if (SKIP_BODY_PATTERNS.some((p) => p.test(m.body))) return false
    // Skip messages that are only [link]
    if (m.body.trim() === "[link]") return false
    return true
  })

  // Deduplicate consecutive identical messages from same sender (forwarded spam)
  const deduped = real.filter((m, i) => {
    if (i === 0) return true
    const prev = real[i - 1]
    return !(m.sender === prev.sender && m.body === prev.body)
  })

  // Normalise participant names (already cleaned via cleanSender)
  const participants = [...new Set(deduped.map((m) => m.sender))].filter(Boolean)

  // Take last maxMessages to stay within token budget
  const truncated = deduped.length > maxMessages
  const slice = truncated ? deduped.slice(-maxMessages) : deduped

  return {
    messages: slice,
    participants,
    dateRange: {
      from: slice[0]?.timestamp ?? "",
      to: slice[slice.length - 1]?.timestamp ?? "",
    },
    totalMessages: deduped.length,
    truncated,
  }
}

export function formatForPrompt(parsed: WaParsed): string {
  return parsed.messages
    .map((m) => `[${m.timestamp}] ${m.sender}: ${m.body}`)
    .join("\n")
}
