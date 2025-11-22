/**
 * OAuth Manager
 * Handles OAuth flows, token storage, and refresh for various providers
 */

import { getAdminDb } from '@/infrastructure/firebase/firebase-server'
import { getProviderById, type OAuthProvider } from './oauth-providers'
import crypto from 'crypto'

export interface OAuthToken {
  providerId: string
  userId: string
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  scope?: string[]
  tokenType?: string
  // Provider-specific metadata
  metadata?: {
    instanceUrl?: string // Salesforce instance URL
    subdomain?: string // Zendesk subdomain
    [key: string]: any
  }
  createdAt: string
  updatedAt: string
}

/**
 * Generate OAuth state for CSRF protection
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Get OAuth authorization URL
 */
export function getOAuthUrl(provider: OAuthProvider, userId: string, redirectUri: string): string {
  const state = generateOAuthState()
  
  // Store state temporarily (in production, use Redis or similar)
  // For now, we'll encode userId in state
  const stateWithUserId = `${state}:${userId}`
  
  const params = new URLSearchParams({
    client_id: process.env[`${provider.id.toUpperCase()}_CLIENT_ID`] || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: provider.scopes.join(' '),
    state: stateWithUserId,
  })

  return `${provider.authUrl}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
  redirectUri: string
): Promise<OAuthToken> {
  const clientId = process.env[`${provider.id.toUpperCase()}_CLIENT_ID`] || ''
  const clientSecret = process.env[`${provider.id.toUpperCase()}_CLIENT_SECRET`] || ''

  const tokenParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const response = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: tokenParams.toString(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Token exchange failed' }))
    throw new Error(`OAuth token exchange failed: ${JSON.stringify(error)}`)
  }

  const tokenData = await response.json()

  // Extract provider-specific metadata
  const metadata: Record<string, any> = {}
  if (provider.id === 'salesforce' && tokenData.instance_url) {
    metadata.instanceUrl = tokenData.instance_url
  }
  if (provider.id === 'zendesk' && tokenData.subdomain) {
    metadata.subdomain = tokenData.subdomain
  }

  return {
    providerId: provider.id,
    userId: '', // Will be set by caller
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
    scope: tokenData.scope ? tokenData.scope.split(' ') : provider.scopes,
    tokenType: tokenData.token_type || 'Bearer',
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Store OAuth token
 */
export async function storeOAuthToken(token: OAuthToken): Promise<void> {
  const adminDb = getAdminDb()
  const collection = adminDb.collection('oauth_tokens')
  
  // Encrypt access token and refresh token
  const encryptedToken = encryptToken(token.accessToken)
  const encryptedRefreshToken = token.refreshToken ? encryptToken(token.refreshToken) : undefined

  const tokenDoc = {
    ...token,
    accessToken: encryptedToken,
    refreshToken: encryptedRefreshToken,
  }

  // Check if token already exists for this user+provider
  const existing = await collection
    .where('userId', '==', token.userId)
    .where('providerId', '==', token.providerId)
    .limit(1)
    .get()

  if (!existing.empty) {
    // Update existing token
    await existing.docs[0].ref.update({
      ...tokenDoc,
      updatedAt: new Date().toISOString(),
    })
  } else {
    // Create new token
    await collection.add(tokenDoc)
  }
}

/**
 * Get OAuth token for user and provider
 */
export async function getOAuthToken(userId: string, providerId: string): Promise<OAuthToken | null> {
  const adminDb = getAdminDb()
  const snapshot = await adminDb.collection('oauth_tokens')
    .where('userId', '==', userId)
    .where('providerId', '==', providerId)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  const data = snapshot.docs[0].data()
  
  // Decrypt tokens
  const decryptedToken: OAuthToken = {
    providerId: data.providerId,
    userId: data.userId,
    accessToken: decryptToken(data.accessToken),
    refreshToken: data.refreshToken ? decryptToken(data.refreshToken) : undefined,
    expiresAt: data.expiresAt,
    scope: data.scope,
    tokenType: data.tokenType,
    metadata: data.metadata,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }

  return decryptedToken
}

/**
 * Refresh OAuth token
 */
export async function refreshOAuthToken(
  provider: OAuthProvider,
  refreshToken: string,
  existingMetadata?: Record<string, any>
): Promise<OAuthToken> {
  const clientId = process.env[`${provider.id.toUpperCase()}_CLIENT_ID`] || ''
  const clientSecret = process.env[`${provider.id.toUpperCase()}_CLIENT_SECRET`] || ''

  const tokenParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const response = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: tokenParams.toString(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Token refresh failed' }))
    throw new Error(`OAuth token refresh failed: ${JSON.stringify(error)}`)
  }

  const tokenData = await response.json()

  // Preserve existing metadata
  const metadata: Record<string, any> = existingMetadata || {}
  
  if (provider.id === 'salesforce' && tokenData.instance_url) {
    metadata.instanceUrl = tokenData.instance_url
  }

  return {
    providerId: provider.id,
    userId: '', // Will be set by caller
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || refreshToken,
    expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
    tokenType: tokenData.token_type || 'Bearer',
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(userId: string, providerId: string): Promise<string> {
  const token = await getOAuthToken(userId, providerId)
  
  if (!token) {
    throw new Error(`No OAuth token found for provider: ${providerId}`)
  }

  // Check if token is expired
  if (token.expiresAt && token.expiresAt < Date.now()) {
    if (!token.refreshToken) {
      throw new Error(`OAuth token expired and no refresh token available for provider: ${providerId}`)
    }

    const provider = getProviderById(providerId)
    if (!provider) {
      throw new Error(`OAuth provider not found: ${providerId}`)
    }

    // Refresh token (preserve existing metadata)
    const refreshedToken = await refreshOAuthToken(provider, token.refreshToken, token.metadata)
    refreshedToken.userId = userId
    
    await storeOAuthToken(refreshedToken)
    
    return refreshedToken.accessToken
  }

  return token.accessToken
}

/**
 * Get OAuth token with metadata
 */
export async function getOAuthTokenWithMetadata(userId: string, providerId: string): Promise<OAuthToken | null> {
  return await getOAuthToken(userId, providerId)
}

/**
 * Encrypt token (simple encryption - in production, use proper encryption)
 */
function encryptToken(token: string): string {
  // In production, use proper encryption (e.g., AES-256-GCM)
  // For MVP: use createCipheriv with proper key derivation
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!'
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.slice(0, 32).padEnd(32)), iv)
  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  // Prepend IV for decryption
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt token
 */
function decryptToken(encryptedToken: string): string {
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!'
  const parts = encryptedToken.split(':')
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted token format')
  }
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.slice(0, 32).padEnd(32)), iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

