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
      return await auth.currentUser.getIdToken(true) // Force refresh to ensure valid token
    }

    // Wait for auth state to be restored from persistence (up to 3 seconds)
    return new Promise((resolve) => {
      let resolved = false
      
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (resolved) return
        
        unsubscribe()
        resolved = true
        
        if (user) {
          user.getIdToken(true) // Force refresh
            .then(resolve)
            .catch((error) => {
              console.error('Error getting ID token after auth state change:', error)
              resolve(null)
            })
        } else {
          resolve(null)
        }
      })

      // Timeout after 3 seconds (give more time for persistence to restore)
      setTimeout(() => {
        if (!resolved) {
          unsubscribe()
          resolved = true
          // Final check - sometimes auth.currentUser is set but onAuthStateChanged hasn't fired yet
          if (auth.currentUser) {
            auth.currentUser.getIdToken(true)
              .then(resolve)
              .catch(() => resolve(null))
          } else {
            resolve(null)
          }
        }
      }, 3000)
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

