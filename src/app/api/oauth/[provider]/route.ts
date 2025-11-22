/**
 * OAuth Routes
 * GET /api/oauth/[provider] - Initiate OAuth flow
 * GET /api/oauth/[provider]/callback - Handle OAuth callback
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { getProviderById, type OAuthProvider } from '@/lib/oauth-providers'
import { getOAuthUrl, exchangeCodeForToken, storeOAuthToken } from '@/lib/oauth-manager'

export const dynamic = 'force-dynamic'

/**
 * Initiate OAuth flow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const providerId = params.provider
    const provider = getProviderById(providerId)

    if (!provider) {
      return NextResponse.json(
        { error: `OAuth provider not found: ${providerId}` },
        { status: 404 }
      )
    }

    // Authenticate user
    let userId: string
    try {
      userId = await requireAuth(request)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      )
    }

    // Get redirect URI from query params or use default
    const redirectUri = request.nextUrl.searchParams.get('redirect_uri') || 
                       `${request.nextUrl.origin}/api/oauth/${providerId}/callback`

    // Generate OAuth URL
    const oauthUrl = getOAuthUrl(provider, userId, redirectUri)

    // For browser redirects, return redirect
    // For API calls (with Authorization header), return JSON with URL
    const acceptHeader = request.headers.get('accept') || ''
    if (acceptHeader.includes('application/json') || request.headers.get('authorization')) {
      return NextResponse.json({ url: oauthUrl })
    }

    // Redirect to OAuth provider
    return NextResponse.redirect(oauthUrl)
  } catch (error: any) {
    console.error('OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow', message: error.message },
      { status: 500 }
    )
  }
}

