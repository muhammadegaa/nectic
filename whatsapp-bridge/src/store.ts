/**
 * Firestore store for session metadata.
 * Session AUTH files live on the persistent volume at /data/{uid}/.
 * Metadata (status, QR, groups, monitored list) lives in Firestore so
 * Nectic's Next.js app can read/write it without calling the bridge directly.
 *
 * Collection: whatsappBridge/{uid}
 */

import { getFirestore } from "firebase-admin/firestore"
import type { SessionMeta } from "./types.js"

const COLLECTION = "whatsappBridge"

export async function getSession(uid: string): Promise<SessionMeta | null> {
  const db = getFirestore()
  const snap = await db.collection(COLLECTION).doc(uid).get()
  if (!snap.exists) return null
  return snap.data() as SessionMeta
}

export async function upsertSession(uid: string, data: Partial<SessionMeta>): Promise<void> {
  const db = getFirestore()
  await db.collection(COLLECTION).doc(uid).set(data, { merge: true })
}

export async function deleteSession(uid: string): Promise<void> {
  const db = getFirestore()
  await db.collection(COLLECTION).doc(uid).delete()
}

export async function setQR(uid: string, qrCode: string): Promise<void> {
  await upsertSession(uid, {
    status: "pending_qr",
    qrCode,
    qrGeneratedAt: new Date().toISOString(),
  })
}

export async function setConnected(uid: string, phoneNumber: string, displayName: string): Promise<void> {
  await upsertSession(uid, {
    status: "connected",
    phoneNumber,
    displayName,
    connectedAt: new Date().toISOString(),
    qrCode: undefined,
  })
}

export async function setDisconnected(uid: string): Promise<void> {
  await upsertSession(uid, {
    status: "disconnected",
    qrCode: undefined,
  })
}
