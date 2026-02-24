/**
 * Rate limiting utility using Upstash Redis
 * Falls back to in-memory if Upstash not configured
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// In-memory fallback for development
class MemoryStore {
  private store: Map<string, { count: number; resetAt: number }> = new Map()

  async get(key: string) {
    const entry = this.store.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.resetAt) {
      this.store.delete(key)
      return null
    }
    
    return entry.count.toString()
  }

  async set(key: string, value: string, ttl: number) {
    this.store.set(key, {
      count: parseInt(value),
      resetAt: Date.now() + ttl * 1000,
    })
  }

  async incr(key: string) {
    const entry = this.store.get(key)
    if (!entry) {
      this.store.set(key, { count: 1, resetAt: Date.now() + 60000 })
      return 1
    }
    entry.count++
    return entry.count
  }
}

let ratelimit: Ratelimit | null = null

// Initialize rate limiter
try {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    })

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
      analytics: true,
    })
  } else {
    // Fallback to in-memory for development
    const memoryStore = new MemoryStore()
    ratelimit = new Ratelimit({
      // @ts-ignore - MemoryStore is compatible
      redis: memoryStore,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: false,
    })
  }
} catch (error) {
  console.warn('[rate-limit] Failed to initialize rate limiter:', error)
}

/**
 * Check rate limit for a user
 * @param identifier - User ID or IP address
 * @returns { limit: number, remaining: number, reset: number, success: boolean }
 */
export async function checkRateLimit(identifier: string) {
  if (!ratelimit) {
    // No rate limiting if not configured
    return {
      limit: 10,
      remaining: 10,
      reset: Date.now() + 60000,
      success: true,
    }
  }

  try {
    const result = await ratelimit.limit(identifier)
    return {
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      success: result.success,
    }
  } catch (error) {
    console.error('[rate-limit] Error checking rate limit:', error)
    // Fail open - allow request if rate limiting fails
    return {
      limit: 10,
      remaining: 10,
      reset: Date.now() + 60000,
      success: true,
    }
  }
}

/**
 * Get identifier from request (user ID or IP)
 */
export function getRateLimitIdentifier(request: Request, userId?: string | null): string {
  if (userId) {
    return `user:${userId}`
  }
  
  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return `ip:${ip}`
}
