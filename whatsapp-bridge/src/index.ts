/**
 * Nectic WhatsApp Bridge
 * Express server — receives commands from Nectic's Next.js proxy routes,
 * manages Baileys sessions, forwards messages to Nectic's webhook pipeline.
 *
 * Runs on Railway with a persistent volume at /data for session auth files.
 */

import express from "express"
import { initializeApp, cert } from "firebase-admin/app"
import { startSession, stopSession, setMonitoredGroups, restoreSessions, sendMessage } from "./session.js"
import { getSession, upsertSession } from "./store.js"

// ── Firebase Admin init ────────────────────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? "{}")
initializeApp({ credential: cert(serviceAccount) })

// ── Express ────────────────────────────────────────────────────────────────────
const app = express()
app.use(express.json())

const PORT = parseInt(process.env.PORT ?? "3001", 10)
const BRIDGE_SECRET = process.env.BRIDGE_SECRET ?? ""

// Auth middleware — all routes require X-Bridge-Secret header
app.use((req, res, next) => {
  if (!BRIDGE_SECRET) return next() // dev: no secret set = open
  const header = req.headers["x-bridge-secret"]
  if (header !== BRIDGE_SECRET) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  next()
})

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ ok: true, sessions: 0 })
})

// ── Start session / generate QR ───────────────────────────────────────────────
// Called by Nectic when user clicks "Connect WhatsApp"
// Body: { uid: string, webhookToken: string }
app.post("/session/:uid/start", async (req, res) => {
  const { uid } = req.params
  const { webhookToken } = req.body as { webhookToken?: string }

  if (!uid || !webhookToken) {
    res.status(400).json({ error: "uid and webhookToken required" })
    return
  }

  try {
    // Non-blocking — QR appears in Firestore within 2-3s
    startSession(uid, webhookToken).catch(console.error)
    res.json({ ok: true, message: "Session starting — poll /session/:uid/status for QR" })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── Session status + QR ────────────────────────────────────────────────────────
// Nectic polls this every 2s while QR modal is open
app.get("/session/:uid/status", async (req, res) => {
  const { uid } = req.params
  try {
    const meta = await getSession(uid)
    if (!meta) {
      res.json({ status: "none" })
      return
    }
    res.json({
      status: meta.status,
      qrCode: meta.qrCode,
      qrGeneratedAt: meta.qrGeneratedAt,
      phoneNumber: meta.phoneNumber,
      displayName: meta.displayName,
      connectedAt: meta.connectedAt,
      monitoredGroups: meta.monitoredGroups ?? [],
      groups: meta.groups ?? [],
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── List groups ────────────────────────────────────────────────────────────────
// Returns cached group list from Firestore (fetched once on connect)
app.get("/session/:uid/groups", async (req, res) => {
  const { uid } = req.params
  try {
    const meta = await getSession(uid)
    res.json({ groups: meta?.groups ?? [] })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── Set monitored groups ───────────────────────────────────────────────────────
// Body: { groupJids: string[] }
app.post("/session/:uid/monitor", async (req, res) => {
  const { uid } = req.params
  const { groupJids } = req.body as { groupJids?: string[] }

  if (!Array.isArray(groupJids)) {
    res.status(400).json({ error: "groupJids must be an array" })
    return
  }

  try {
    await setMonitoredGroups(uid, groupJids)
    res.json({ ok: true, monitoring: groupJids.length })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── Send message ──────────────────────────────────────────────────────────────
// Body: { jid: string, text: string }
// jid = group JID (120363xxxx@g.us) or phone (1234567890@s.whatsapp.net)
app.post("/session/:uid/send", async (req, res) => {
  const { uid } = req.params
  const { jid, text } = req.body as { jid?: string; text?: string }

  if (!jid || !text?.trim()) {
    res.status(400).json({ error: "jid and text required" })
    return
  }

  try {
    await sendMessage(uid, jid, text.trim())
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── Disconnect ─────────────────────────────────────────────────────────────────
app.delete("/session/:uid", async (req, res) => {
  const { uid } = req.params
  try {
    await stopSession(uid, true)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`WhatsApp bridge listening on port ${PORT}`)
  // Re-hydrate sessions that were live before last restart
  try {
    await restoreSessions()
  } catch (err) {
    console.error("Failed to restore sessions:", err)
  }
})
