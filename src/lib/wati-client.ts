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
  // WATI API: GET /api/v1/getContacts
  // Response shape A: { result: { items: WatiContact[], totalCount: number } }
  // Response shape B: { result: WatiContact[] }  (older versions)
  const url = `${base}/api/v1/getContacts?pageSize=${pageSize}&pageNumber=${pageNumber}`

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(token),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status}: ${body.slice(0, 300)}`)
  }

  const data = await res.json()

  let items: WatiContact[] = []
  let totalCount = 0

  if (Array.isArray(data?.result?.items)) {
    items = data.result.items
    totalCount = data.result.totalCount ?? items.length
  } else if (Array.isArray(data?.result)) {
    items = data.result
    totalCount = data.totalCount ?? items.length
  } else if (Array.isArray(data?.contacts)) {
    items = data.contacts
    totalCount = data.totalCount ?? items.length
  }

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

  // { result: false } means no conversation through WATI for this contact
  if (data?.result === false) {
    return { messages: [], totalCount: 0 }
  }

  // Shape A: { messages: { items: [...], totalCount: N } }
  // Shape B: { result: { messages: { items: [...] } } }
  // Shape C: { items: [...] }
  let items: WatiMessage[] = []
  let totalCount = 0

  if (Array.isArray(data?.messages?.items)) {
    items = data.messages.items
    totalCount = data.messages.totalCount ?? items.length
  } else if (Array.isArray(data?.result?.messages?.items)) {
    items = data.result.messages.items
    totalCount = data.result.messages.totalCount ?? items.length
  } else if (Array.isArray(data?.items)) {
    items = data.items
    totalCount = data.totalCount ?? items.length
  } else if (Array.isArray(data?.messages)) {
    items = data.messages
    totalCount = data.totalCount ?? items.length
  }

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
