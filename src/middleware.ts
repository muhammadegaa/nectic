import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Protected routes that require authentication
const protectedRoutes = ["/dashboard", "/agents"]

// Public routes that don't require authentication
const publicRoutes = ["/", "/auth/login", "/auth/signup", "/api"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))

  // For API routes, we handle auth in the route handlers
  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  // For protected routes, redirect to login if no auth token
  // Note: Client-side auth check happens in components using useAuth hook
  // This middleware is a basic layer - full auth verification happens client-side
  if (isProtectedRoute && !isPublicRoute) {
    // Check for auth token in cookies (if using cookie-based auth)
    // For now, we rely on client-side redirects in components
    // This can be enhanced with server-side session validation
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
