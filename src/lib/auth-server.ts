/**
 * Server-side authentication utilities
 * Verifies Firebase ID tokens from Authorization headers
 */

import { getAdminAuth } from '@/infrastructure/firebase/firebase-server'
import { NextRequest } from 'next/server'

/**
 * Get authenticated user ID from request
 * Verifies Firebase ID token from Authorization header
 * 
 * @param request - Next.js request object
 * @returns User ID if authenticated, null otherwise
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('authorization')
    
    console.log('[auth-server] Authorization header present:', !!authHeader)
    console.log('[auth-server] Authorization header starts with Bearer:', authHeader?.startsWith('Bearer '))
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[auth-server] No valid Authorization header')
      return null
    }

    // Extract token
    const idToken = authHeader.substring(7)
    console.log('[auth-server] Token length:', idToken.length)
    console.log('[auth-server] Token preview:', idToken.substring(0, 20) + '...')

    // Verify token with Firebase Admin
    const adminAuth = getAdminAuth()
    console.log('[auth-server] AdminAuth initialized:', !!adminAuth)
    
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    console.log('[auth-server] Token verified successfully, UID:', decodedToken.uid)
    
    return decodedToken.uid
  } catch (error: any) {
    console.error('[auth-server] Error verifying auth token:', error.message)
    console.error('[auth-server] Error code:', error.code)
    console.error('[auth-server] Error stack:', error.stack)
    return null
  }
}

/**
 * Require authentication - throws if user is not authenticated
 * 
 * @param request - Next.js request object
 * @returns User ID
 * @throws Error if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<string> {
  const userId = await getAuthenticatedUserId(request)
  
  if (!userId) {
    throw new Error('Unauthorized: Authentication required')
  }
  
  return userId
}

