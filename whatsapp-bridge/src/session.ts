/**
 * One Baileys session per Nectic user (uid).
 * Auth files stored at DATA_DIR/{uid}/ — persists across restarts via Railway volume.
 * On message: format as WATI webhook payload → POST to Nectic.
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  proto,
  getContentType,
} from "@whiskeysockets/baileys"
import { Boom } from "@hapi/boom"
import pino from "pino"
import fs from "fs"
import path from "path"
import QRCode from "qrcode"
import { getSession, upsertSession, setQR, setConnected, setDisconnected } from "./store.js"
import type { WhatsAppGroup } from "./types.js"

const DATA_DIR = process.env.DATA_DIR ?? "/data"
const NECTIC_BASE_URL = process.env.NECTIC_BASE_URL ?? "https://app.nectic.xyz"
const logger = pino({ level: "info" })

// In-memory map of active sockets per uid
const activeSockets = new Map<string, ReturnType<typeof makeWASocket>>()

function sessionDir(uid: string): string {
  const dir = path.join(DATA_DIR, uid)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function removeSessionDir(uid: string): void {
  const dir = path.join(DATA_DIR, uid)
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
}

/**
 * Extract plain text from a Baileys message.
 * Handles text, extendedText, conversation, and quoted messages.
 */
function extractText(msg: proto.IWebMessageInfo): string | null {
  const content = msg.message
  if (!content) return null
  const type = getContentType(content)
  if (!type) return null

  if (type === "conversation") return content.conversation ?? null
  if (type === "extendedTextMessage") return content.extendedTextMessage?.text ?? null
  if (type === "imageMessage") return content.imageMessage?.caption ?? null
  if (type === "videoMessage") return content.videoMessage?.caption ?? null
  return null
}

/**
 * POST a single message to Nectic's existing WATI webhook endpoint.
 * The webhook handler is identical — Baileys messages are adapted to WATI shape.
 */
async function forwardToNectic(
  webhookToken: string,
  waId: string,          // group JID used as the "phone" identifier
  senderName: string,
  text: string,
  timestamp: string,
  messageId: string,
): Promise<void> {
  const url = `${NECTIC_BASE_URL}/api/whatsapp/webhook?token=${encodeURIComponent(webhookToken)}`
  const payload = {
    id: messageId,
    eventType: "message",
    type: "text",
    text,
    owner: false,   // always customer-side — we never forward our own messages
    waId,
    senderName,
    timestamp,
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      logger.warn({ uid: waId, status: res.status }, "Nectic webhook returned non-200")
    }
  } catch (err) {
    logger.error({ err }, "Failed to forward message to Nectic")
  }
}

export async function startSession(uid: string, webhookToken: string): Promise<void> {
  // Kill existing socket if any
  if (activeSockets.has(uid)) {
    await stopSession(uid, false)
  }

  await upsertSession(uid, {
    uid,
    status: "pending_qr",
    webhookToken,
    monitoredGroups: [],
  })

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir(uid))
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }) as Parameters<typeof makeWASocket>[0]["logger"],
    printQRInTerminal: false,
    auth: state,
    // Don't cache all history — only what arrives during active session
    getMessage: async () => undefined,
  })

  activeSockets.set(uid, sock)

  // ── Connection updates ─────────────────────────────────────────────────────
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      const qrDataUrl = await QRCode.toDataURL(qr)
      await setQR(uid, qrDataUrl)
      logger.info({ uid }, "QR generated")
    }

    if (connection === "open") {
      const me = sock.user
      const phone = me?.id?.split(":")[0] ?? me?.id ?? "unknown"
      const name = me?.name ?? phone
      await setConnected(uid, phone, name)
      logger.info({ uid, phone }, "WhatsApp connected")

      // Fetch and cache group list once connected
      try {
        const groups = await fetchGroups(sock)
        await upsertSession(uid, { groups })
        logger.info({ uid, count: groups.length }, "Groups fetched")
      } catch (err) {
        logger.warn({ uid, err }, "Could not fetch groups")
      }
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      logger.info({ uid, statusCode, shouldReconnect }, "Connection closed")

      if (shouldReconnect) {
        await upsertSession(uid, { status: "reconnecting" })
        // Exponential backoff — simple 3s wait for MVP
        setTimeout(() => startSession(uid, webhookToken), 3000)
      } else {
        // Logged out — clean up
        activeSockets.delete(uid)
        removeSessionDir(uid)
        await setDisconnected(uid)
      }
    }
  })

  // ── Save credentials on every update ──────────────────────────────────────
  sock.ev.on("creds.update", saveCreds)

  // ── Incoming messages ──────────────────────────────────────────────────────
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return

    // Read current monitored groups from Firestore (user may have updated selection)
    const meta = await getSession(uid)
    if (!meta || meta.status !== "connected") return
    const monitored = new Set(meta.monitoredGroups ?? [])
    if (monitored.size === 0) return

    for (const msg of messages) {
      // Skip our own messages
      if (msg.key.fromMe) continue
      // Only group messages
      const jid = msg.key.remoteJid ?? ""
      if (!jid.endsWith("@g.us")) continue
      if (!monitored.has(jid)) continue

      const text = extractText(msg)
      if (!text?.trim()) continue

      const senderJid = msg.key.participant ?? msg.participant ?? ""
      const senderName = msg.pushName ?? senderJid.split("@")[0] ?? "Unknown"
      const timestamp = msg.messageTimestamp
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString()
      const messageId = msg.key.id ?? `${jid}-${Date.now()}`

      await forwardToNectic(
        meta.webhookToken,
        jid,          // group JID as waId — unique per group
        senderName,
        text.trim(),
        timestamp,
        messageId,
      )
    }
  })
}

export async function stopSession(uid: string, cleanStorage = true): Promise<void> {
  const sock = activeSockets.get(uid)
  if (sock) {
    try { sock.end(undefined) } catch {}
    activeSockets.delete(uid)
  }
  if (cleanStorage) {
    removeSessionDir(uid)
    await setDisconnected(uid)
  }
}

export async function setMonitoredGroups(uid: string, groupJids: string[]): Promise<void> {
  await upsertSession(uid, { monitoredGroups: groupJids })
}

export async function sendMessage(uid: string, jid: string, text: string): Promise<void> {
  const sock = activeSockets.get(uid)
  if (!sock) throw new Error("No active session for this user — rescan QR to reconnect")
  await sock.sendMessage(jid, { text })
}

async function fetchGroups(sock: ReturnType<typeof makeWASocket>): Promise<WhatsAppGroup[]> {
  const groups = await sock.groupFetchAllParticipating()
  return Object.values(groups).map((g) => ({
    jid: g.id,
    name: g.subject,
    participantCount: g.participants?.length ?? 0,
  }))
}

/**
 * Re-hydrate sessions that were active before the service restarted.
 * Reads all documents from whatsappBridge collection where status = "connected".
 */
export async function restoreSessions(): Promise<void> {
  const { getFirestore } = await import("firebase-admin/firestore")
  const db = getFirestore()
  const snap = await db.collection("whatsappBridge")
    .where("status", "in", ["connected", "reconnecting"])
    .get()

  logger.info({ count: snap.size }, "Restoring sessions from Firestore")

  for (const doc of snap.docs) {
    const meta = doc.data()
    if (meta.uid && meta.webhookToken) {
      logger.info({ uid: meta.uid }, "Restoring session")
      startSession(meta.uid, meta.webhookToken).catch((err) =>
        logger.error({ uid: meta.uid, err }, "Failed to restore session"),
      )
    }
  }
}
