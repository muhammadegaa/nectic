/**
 * Upload session store - Redis (Upstash) or in-memory for dev
 * Session-scoped: upload data lives 24h, keyed by sessionId
 */

import { Redis } from '@upstash/redis'

const TTL_SECONDS = 24 * 60 * 60 // 24 hours

export interface UploadSession {
  sessionId: string
  schema: { fields: string[]; sampleRow?: Record<string, unknown> }
  rows: Record<string, unknown>[]
  rowCount: number
  createdAt: string
}

const memoryStore = new Map<string, string>()

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

export async function setUploadSession(sessionId: string, data: Omit<UploadSession, 'sessionId' | 'createdAt'>): Promise<void> {
  const session: UploadSession = {
    sessionId,
    ...data,
    createdAt: new Date().toISOString(),
  }
  const json = JSON.stringify(session)
  const redis = getRedis()
  if (redis) {
    await redis.set(`upload:${sessionId}`, json, { ex: TTL_SECONDS })
  } else {
    memoryStore.set(`upload:${sessionId}`, json)
    setTimeout(() => memoryStore.delete(`upload:${sessionId}`), TTL_SECONDS * 1000)
  }
}

export async function getUploadSession(sessionId: string): Promise<UploadSession | null> {
  const redis = getRedis()
  let json: string | null
  if (redis) {
    json = await redis.get(`upload:${sessionId}`)
  } else {
    json = memoryStore.get(`upload:${sessionId}`) ?? null
  }
  if (!json) return null
  try {
    return JSON.parse(json) as UploadSession
  } catch {
    return null
  }
}
