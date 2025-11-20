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
    // If currentUser is available, use it
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken()
    }

    // Otherwise, wait for auth state to be ready (up to 2 seconds)
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe()
        if (user) {
          user.getIdToken().then(resolve).catch(() => resolve(null))
        } else {
          resolve(null)
        }
      })

      // Timeout after 2 seconds
      setTimeout(() => {
        unsubscribe()
        resolve(null)
      }, 2000)
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

