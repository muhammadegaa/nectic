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

// Handles Android, iOS, and locale-variant WhatsApp export formats
const PATTERNS = [
  // [DD/MM/YYYY, HH:MM:SS] Sender: message  (iOS)
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*([^:]+):\s*(.+)/,
  // DD/MM/YYYY, HH:MM - Sender: message  (Android)
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.+)/,
  // DD/MM/YY, HH.MM - Sender: message  (some locales use dots)
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}\.\d{2})\s*-\s*([^:]+):\s*(.+)/,
]

const SYSTEM_KEYWORDS = [
  "messages and calls are end-to-end encrypted",
  "created group",
  "added",
  "removed",
  "left",
  "changed the group",
  "changed this group",
  "security code changed",
  "joined using this group",
  "pesan dan panggilan dienkripsi",
  "membuat grup",
  "menambahkan",
  "menghapus",
  "keluar",
]

export function parseWhatsAppExport(raw: string, maxMessages = 400): WaParsed {
  const lines = raw.split(/\r?\n/)
  const messages: WaMessage[] = []
  let current: WaMessage | null = null

  for (const line of lines) {
    let matched = false

    for (const pattern of PATTERNS) {
      const m = line.match(pattern)
      if (m) {
        if (current) messages.push(current)
        const [, date, time, sender, body] = m
        const isSystem = SYSTEM_KEYWORDS.some((kw) =>
          body.toLowerCase().includes(kw) || sender.toLowerCase().includes(kw)
        )
        current = {
          timestamp: `${date} ${time}`.trim(),
          sender: sender.trim(),
          body: body.trim(),
          isSystem,
        }
        matched = true
        break
      }
    }

    // Continuation line (multi-line message)
    if (!matched && current && line.trim()) {
      current.body += "\n" + line.trim()
    }
  }

  if (current) messages.push(current)

  // Filter system messages, empty bodies
  const real = messages.filter((m) => !m.isSystem && m.body.length > 1 && m.body !== "<Media omitted>" && m.body !== "image omitted")

  const participants = [...new Set(real.map((m) => m.sender))].filter(Boolean)

  // Take last maxMessages to stay within token budget
  const truncated = real.length > maxMessages
  const slice = truncated ? real.slice(-maxMessages) : real

  return {
    messages: slice,
    participants,
    dateRange: {
      from: slice[0]?.timestamp ?? "",
      to: slice[slice.length - 1]?.timestamp ?? "",
    },
    totalMessages: real.length,
    truncated,
  }
}

export function formatForPrompt(parsed: WaParsed): string {
  return parsed.messages
    .map((m) => `[${m.timestamp}] ${m.sender}: ${m.body}`)
    .join("\n")
}
