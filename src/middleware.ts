import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rate-limited API routes (calls OpenRouter — protect against cost abuse)
const RATE_LIMITED_ROUTES = [
  "/api/concept/analyze",
  "/api/concept/reanalyze",
  "/api/concept/brief",
  "/api/concept/chat",
  "/api/concept/classify-participants",
]

// Lazy-initialised Upstash rate limiter — only active when env vars are present
let ratelimit: { limit: (id: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> } | null = null

async function getRatelimit() {
  if (ratelimit) return ratelimit
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  try {
    const { Ratelimit } = await import("@upstash/ratelimit")
    const { Redis } = await import("@upstash/redis")
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(30, "1 h"),
      analytics: true,
      prefix: "nectic_rl",
    })
    return ratelimit
  } catch {
    return null
  }
}

const protectedRoutes = ["/dashboard", "/agents", "/concept"]
const publicRoutes = ["/", "/auth/login", "/auth/signup", "/api", "/concept/login", "/demo", "/pricing", "/privacy"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limit expensive AI routes
  const isRateLimited = RATE_LIMITED_ROUTES.some((r) => pathname.startsWith(r))
  if (isRateLimited) {
    const limiter = await getRatelimit()
    if (limiter) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "anonymous"
      const { success, limit, remaining, reset } = await limiter.limit(ip)
      if (!success) {
        return new NextResponse(JSON.stringify({ error: "Too many requests. Please wait before trying again." }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          },
        })
      }
    }
    return NextResponse.next()
  }

  // All other API routes — pass through (auth handled in route handlers)
  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))

  // Client-side auth redirects handle protected routes
  if (isProtectedRoute && !isPublicRoute) {
    // Enhanced: can add server-side session validation here in future
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
