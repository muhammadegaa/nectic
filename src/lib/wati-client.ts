// WATI (WhatsApp Team Inbox) API client
// Docs: https://docs.wati.io/reference/introduction

export interface WatiContact {
  id: string
  wAid: string         // WhatsApp ID / phone number
  fullName?: string
  firstName?: string
  lastName?: string
  phone: string
  created?: string
  lastUpdated?: string
  source?: string
  optedIn?: boolean
  contactStatus?: string
}

export interface WatiMessage {
  id: string
  created: string      // ISO timestamp
  text?: string
  type: string         // "text" | "image" | "document" | "audio" | "video" | "sticker"
  owner: boolean       // true = sent by agent (vendor), false = received from customer
  statusString?: string
  senderName?: string
  senderPhoneNumber?: string
  operatorName?: string
  operatorEmail?: string
  waId?: string
}

export interface WatiContactsResponse {
  contacts: WatiContact[]
  totalCount: number
}

export interface WatiMessagesResponse {
  messages: WatiMessage[]
  totalCount: number
}

function buildHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

// Normalize endpoint — strip trailing slash, ensure https://
function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, "")
}

export async function watiGetContacts(
  endpoint: string,
  token: string,
  pageSize = 100,
  pageNumber = 1
): Promise<WatiContactsResponse> {
  const base = normalizeEndpoint(endpoint)
  // WATI EU API: GET /api/v1/contacts returns { ok: true, result: WatiContact[] }
  const url = `${base}/api/v1/contacts?pageSize=${pageSize}&pageNumber=${pageNumber}`

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(token),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`WATI contacts error ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json()

  // Response: { ok: true, result: WatiContact[] }
  const items: WatiContact[] = Array.isArray(data?.result) ? data.result : []
  const totalCount: number = data?.totalCount ?? items.length

  return { contacts: items, totalCount }
}

export async function watiGetMessages(
  endpoint: string,
  token: string,
  whatsappNumber: string,
  pageSize = 200
): Promise<WatiMessagesResponse> {
  const base = normalizeEndpoint(endpoint)
  // Remove + from phone number for URL
  const phone = whatsappNumber.replace(/^\+/, "")
  const url = `${base}/api/v1/getMessages/${phone}?pageSize=${pageSize}&pageNumber=1`

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(token),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`WATI messages error ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json()

  // WATI returns { result: false, info: "..." } when no conversation exists — treat as empty
  if (data?.result === false) {
    return { messages: [], totalCount: 0 }
  }

  // Success: { result: true, messages: { items: [], totalCount: number } }
  const items: WatiMessage[] = data?.messages?.items ?? data?.items ?? data?.messages ?? []
  const totalCount: number = data?.messages?.totalCount ?? data?.totalCount ?? items.length

  return { messages: items, totalCount }
}

// Format WATI messages into the conversation text format the analysis pipeline expects
export function formatWatiMessagesForAnalysis(
  messages: WatiMessage[],
  contactName: string,
  agentName = "Support Team"
): { conversation: string; participantRoles: Record<string, "vendor" | "customer"> } {
  // Sort messages by created time (oldest first)
  const sorted = [...messages].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
  )

  const vendorNames = new Set<string>()
  const customerNames = new Set<string>()

  const lines = sorted
    .filter((m) => m.text?.trim())
    .map((m) => {
      const date = new Date(m.created)
      const dateStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
      const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

      let sender: string
      if (m.owner) {
        // Sent by agent / vendor side
        sender = m.operatorName?.trim() || agentName
        vendorNames.add(sender)
      } else {
        // Received from customer
        sender = m.senderName?.trim() || contactName
        customerNames.add(sender)
      }

      return `[${dateStr}, ${timeStr}] ${sender}: ${m.text}`
    })

  const participantRoles: Record<string, "vendor" | "customer"> = {}
  vendorNames.forEach((n) => { participantRoles[n] = "vendor" })
  customerNames.forEach((n) => { participantRoles[n] = "customer" })

  return {
    conversation: lines.join("\n"),
    participantRoles,
  }
}
