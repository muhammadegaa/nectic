import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that require authentication
const PROTECTED_PATHS = [
  '/dashboard/scanning',
  '/dashboard/documents',
  '/dashboard/opportunities',
  '/dashboard/profile',
  '/dashboard/settings'
]

// Define paths that are always accessible
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/dashboard/assessment',
  '/pricing',
  '/checkout'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths and their subpaths
  if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next()
  }

  // Check if path is protected
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))

  if (isProtectedPath) {
    // Get the token from the cookies
    const token = request.cookies.get('auth-token')

    // If no token, redirect to login
    if (!token) {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}