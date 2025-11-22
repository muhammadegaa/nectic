/**
 * OAuth Callback Handler
 * GET /api/oauth/[provider]/callback - Handle OAuth callback
 */

import { NextRequest, NextResponse } from 'next/server'
import { getProviderById } from '@/lib/oauth-providers'
import { exchangeCodeForToken, storeOAuthToken } from '@/lib/oauth-manager'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const providerId = params.provider
    const provider = getProviderById(providerId)

    if (!provider) {
      return NextResponse.redirect(`${request.nextUrl.origin}/agents/new?error=provider_not_found`)
    }

    // Get authorization code and state from query params
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const error = request.nextUrl.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${request.nextUrl.origin}/agents/new?error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${request.nextUrl.origin}/agents/new?error=missing_params`)
    }

    // Extract userId from state (format: "state:userId")
    const [oauthState, userId] = state.split(':')
    if (!userId) {
      return NextResponse.redirect(`${request.nextUrl.origin}/agents/new?error=invalid_state`)
    }

    // Exchange code for token
    const redirectUri = `${request.nextUrl.origin}/api/oauth/${providerId}/callback`
    const token = await exchangeCodeForToken(provider, code, redirectUri)
    token.userId = userId

    // Store token
    await storeOAuthToken(token)

    // Redirect back to agent creation page with success
    return NextResponse.redirect(`${request.nextUrl.origin}/agents/new?oauth_success=${providerId}`)
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${request.nextUrl.origin}/agents/new?error=oauth_failed`)
  }
}

