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
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    // Extract token
    const idToken = authHeader.substring(7)

    // Verify token with Firebase Admin
    const adminAuth = getAdminAuth()
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    return decodedToken.uid
  } catch (error) {
    console.error('Error verifying auth token:', error)
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

