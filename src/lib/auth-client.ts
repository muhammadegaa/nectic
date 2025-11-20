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
    // First check if currentUser is available (fast path)
    if (auth.currentUser) {
      try {
        return await auth.currentUser.getIdToken(false) // Don't force refresh on fast path
      } catch (error) {
        console.error('Error getting token from currentUser:', error)
        // Fall through to wait for auth state
      }
    }

    // Wait for auth state to be restored from persistence (up to 5 seconds)
    return new Promise((resolve) => {
      let resolved = false
      let timeoutId: NodeJS.Timeout | null = null
      
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (resolved) return
        
        if (user) {
          unsubscribe()
          if (timeoutId) clearTimeout(timeoutId)
          resolved = true
          
          user.getIdToken(false) // Don't force refresh - use cached if available
            .then((token) => {
              resolve(token)
            })
            .catch((error) => {
              console.error('Error getting ID token after auth state change:', error)
              resolve(null)
            })
        } else if (!resolved) {
          // User is null - check one more time after a short delay
          // Sometimes persistence takes a moment to restore
          setTimeout(() => {
            if (!resolved && auth.currentUser) {
              unsubscribe()
              if (timeoutId) clearTimeout(timeoutId)
              resolved = true
              auth.currentUser.getIdToken(false)
                .then(resolve)
                .catch(() => resolve(null))
            } else if (!resolved) {
              unsubscribe()
              if (timeoutId) clearTimeout(timeoutId)
              resolved = true
              resolve(null)
            }
          }, 500)
        }
      })

      // Timeout after 5 seconds (give plenty of time for persistence to restore)
      timeoutId = setTimeout(() => {
        if (!resolved) {
          unsubscribe()
          resolved = true
          // Final check - sometimes auth.currentUser is set but onAuthStateChanged hasn't fired yet
          if (auth.currentUser) {
            auth.currentUser.getIdToken(false)
              .then(resolve)
              .catch(() => resolve(null))
          } else {
            resolve(null)
          }
        }
      }, 5000)
    })
  } catch (error) {
    console.error('Error getting ID token:', error)
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

