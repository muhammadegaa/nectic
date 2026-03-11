export interface SessionMeta {
  uid: string
  status: "pending_qr" | "connected" | "disconnected" | "reconnecting"
  qrCode?: string          // base64 PNG data URL
  qrGeneratedAt?: string   // ISO — frontend knows when to re-request
  phoneNumber?: string     // E.164 after connection
  displayName?: string
  webhookToken: string     // user's Nectic webhook token — used to POST messages
  monitoredGroups: string[]  // group JIDs the user has selected
  groups?: WhatsAppGroup[] // fetched once on connect, cached
  connectedAt?: string
}

export interface WhatsAppGroup {
  jid: string
  name: string
  participantCount: number
}
