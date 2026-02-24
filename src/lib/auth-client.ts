/**
 * Client-side authentication utilities
 * Gets Firebase ID token for API requests
 */

"use client"

import { auth } from '@/infrastructure/firebase/firebase-client'

/**
 * Get Firebase ID token for authenticated user
 * Waits for auth state to be ready if needed
 * @returns ID token string or null if not authenticated
 */
export async function getIdToken(): Promise<string | null> {
  try {
    // DEBUG: Log current state
    console.log('[getIdToken] auth.currentUser:', auth.currentUser?.uid || 'null')
    
    // First check if currentUser is available (fast path)
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken(false)
        console.log('[getIdToken] Got token from currentUser:', token ? 'yes' : 'no')
        return token
      } catch (error) {
        console.error('[getIdToken] Error getting token from currentUser:', error)
        // Fall through to wait for auth state
      }
    }

    // Wait for auth state to be restored from persistence
    console.log('[getIdToken] Waiting for auth state...')
    return new Promise((resolve) => {
      let resolved = false
      let timeoutId: NodeJS.Timeout | null = null
      
      const unsubscribe = auth.onAuthStateChanged((user) => {
        console.log('[getIdToken] onAuthStateChanged fired, user:', user?.uid || 'null')
        
        if (resolved) return
        
        if (user) {
          unsubscribe()
          if (timeoutId) clearTimeout(timeoutId)
          resolved = true
          
          user.getIdToken(false)
            .then((token) => {
              console.log('[getIdToken] Got token from onAuthStateChanged:', token ? 'yes' : 'no')
              resolve(token)
            })
            .catch((error) => {
              console.error('[getIdToken] Error getting ID token after auth state change:', error)
              resolve(null)
            })
        } else {
          // User is null - this might be the initial state before persistence restores
          // Don't resolve yet, wait for timeout or another state change
        }
      })

      // Timeout after 3 seconds
      timeoutId = setTimeout(() => {
        if (!resolved) {
          console.log('[getIdToken] Timeout reached, checking currentUser one more time')
          unsubscribe()
          resolved = true
          // Final check
          if (auth.currentUser) {
            auth.currentUser.getIdToken(false)
              .then((token) => {
                console.log('[getIdToken] Got token from timeout check:', token ? 'yes' : 'no')
                resolve(token)
              })
              .catch(() => {
                console.log('[getIdToken] Failed to get token from timeout check')
                resolve(null)
              })
          } else {
            console.log('[getIdToken] No currentUser after timeout')
            resolve(null)
          }
        }
      }, 3000)
    })
  } catch (error) {
    console.error('[getIdToken] Exception:', error)
    return null
  }
}

/**
 * Get headers with Authorization token for API requests
 * @returns Headers object with Authorization header
 * @throws Error if user is not authenticated
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getIdToken()
  
  if (!token) {
    throw new Error('User is not authenticated. Please log in.')
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

