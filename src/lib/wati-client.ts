// WATI (WhatsApp Team Inbox) API client
// Supports V1 and V3 APIs — auto-detects based on response shape
// V3 docs: https://docs.wati.io/reference/introduction

export interface WatiContact {
  id: string
  wAid: string
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
  created: string
  text?: string
  type: string
  owner: boolean
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

export interface WatiSendResult {
  ok: boolean
  messageId?: string
  error?: string
}

function buildHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, "").trim()
}

export async function watiGetContacts(
  endpoint: string,
  token: string,
  pageSize = 100,
  pageNumber = 1
): Promise<WatiContactsResponse> {
  const base = normalizeEndpoint(endpoint)

  // Try V3 first (recommended), fall back to V1
  const v3url = `${base}/api/ext/v3/contacts?page_number=${pageNumber}&page_size=${pageSize}`
  const v1url = `${base}/api/v1/getContacts?pageSize=${pageSize}&pageNumber=${pageNumber}`

  let res = await fetch(v3url, { method: "GET", headers: buildHeaders(token) })

  // If V3 returns 404 (old account), try V1
  if (res.status === 404) {
    res = await fetch(v1url, { method: "GET", headers: buildHeaders(token) })
  }

  if (!res.ok) {
    const body = await res.text()
    let hint = ""
    if (res.status === 401) hint = " — check your API token"
    else if (res.status === 403) hint = " — token may lack read permissions"
    throw new Error(`WATI ${res.status}${hint}: ${body.slice(0, 200)}`)
  }

  const data = await res.json()
  let items: WatiContact[] = []
  let totalCount = 0

  // V3 shape: { contact_list: [...], page_number, page_size }
  if (Array.isArray(data?.contact_list)) {
    items = data.contact_list.map(normalizeV3Contact)
    totalCount = data.contact_list.length
  }
  // V1 shape A: { result: { items: [...], totalCount: N } }
  else if (Array.isArray(data?.result?.items)) {
    items = data.result.items
    totalCount = data.result.totalCount ?? items.length
  }
  // V1 shape B: { result: [...] }
  else if (Array.isArray(data?.result)) {
    items = data.result
    totalCount = data.totalCount ?? items.length
  }
  // V1 shape C: { contacts: [...] }
  else if (Array.isArray(data?.contacts)) {
    items = data.contacts
    totalCount = data.totalCount ?? items.length
  }

  return { contacts: items, totalCount }
}

// Normalize V3 contact shape to our internal WatiContact shape
function normalizeV3Contact(c: Record<string, unknown>): WatiContact {
  return {
    id: (c.id as string) ?? "",
    wAid: (c.wa_id as string) ?? (c.phone as string) ?? "",
    fullName: (c.name as string) ?? (c.display_name as string) ?? undefined,
    phone: (c.phone as string) ?? "",
    created: (c.created as string) ?? undefined,
    lastUpdated: (c.last_updated as string) ?? undefined,
    source: (c.source as string) ?? undefined,
    optedIn: (c.opted_in as boolean) ?? undefined,
    contactStatus: (c.contact_status as string) ?? undefined,
  }
}

export async function watiGetMessages(
  endpoint: string,
  token: string,
  whatsappNumber: string,
  pageSize = 100
): Promise<WatiMessagesResponse> {
  const base = normalizeEndpoint(endpoint)
  const phone = whatsappNumber.replace(/^\+/, "")

  // Try V3 first
  const v3url = `${base}/api/ext/v3/conversations/${phone}/messages?page_number=1&page_size=${Math.min(pageSize, 100)}`
  const v1url = `${base}/api/v1/getMessages/${phone}?pageSize=${pageSize}&pageNumber=1`

  let res = await fetch(v3url, { method: "GET", headers: buildHeaders(token) })

  if (res.status === 404) {
    res = await fetch(v1url, { method: "GET", headers: buildHeaders(token) })
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`WATI messages ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json()

  if (data?.result === false) {
    return { messages: [], totalCount: 0 }
  }

  let items: WatiMessage[] = []
  let totalCount = 0

  // V3 shape: { message_list: [...], page_number, page_size }
  if (Array.isArray(data?.message_list)) {
    items = data.message_list
      .filter((m: Record<string, unknown>) => m.event_type === "message" || m.text)
      .map((m: Record<string, unknown>): WatiMessage => ({
        id: (m.id as string) ?? "",
        created: (m.created as string) ?? (m.timestamp as string) ?? "",
        text: (m.text as string) ?? undefined,
        type: (m.type as string) ?? "text",
        owner: (m.owner as boolean) ?? false,
        operatorName: (m.operator_name as string) ?? undefined,
      }))
    totalCount = items.length
  }
  // V1 shape A: { messages: { items: [...] } }
  else if (Array.isArray(data?.messages?.items)) {
    items = data.messages.items
    totalCount = data.messages.totalCount ?? items.length
  }
  // V1 shape B: { result: { messages: { items: [...] } } }
  else if (Array.isArray(data?.result?.messages?.items)) {
    items = data.result.messages.items
    totalCount = data.result.messages.totalCount ?? items.length
  }
  // V1 shape C: { items: [...] }
  else if (Array.isArray(data?.items)) {
    items = data.items
    totalCount = data.totalCount ?? items.length
  }
  // V1 shape D: { messages: [...] }
  else if (Array.isArray(data?.messages)) {
    items = data.messages
    totalCount = data.totalCount ?? items.length
  }

  return { messages: items, totalCount }
}

// Send a WhatsApp message via WATI session message API
// Requires an open conversation session with the contact
export async function watiSendMessage(
  endpoint: string,
  token: string,
  whatsappNumber: string,
  messageText: string
): Promise<WatiSendResult> {
  const base = normalizeEndpoint(endpoint)
  const phone = whatsappNumber.replace(/^\+/, "")
  const encodedText = encodeURIComponent(messageText)
  const url = `${base}/api/v1/sendSessionMessage/${phone}?messageText=${encodedText}`

  const res = await fetch(url, {
    method: "POST",
    headers: buildHeaders(token),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`WATI send ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json()
  return {
    ok: data.ok === true || data.result === "success",
    messageId: data.message?.id ?? data.message?.whatsappMessageId,
  }
}

// Format WATI messages into the conversation text format the analysis pipeline expects
export function formatWatiMessagesForAnalysis(
  messages: WatiMessage[],
  contactName: string,
  agentName = "Support Team"
): { conversation: string; participantRoles: Record<string, "vendor" | "customer"> } {
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
        sender = m.operatorName?.trim() || agentName
        vendorNames.add(sender)
      } else {
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
