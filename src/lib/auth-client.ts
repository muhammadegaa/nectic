/**
 * Client-side authentication utilities
 * Gets Firebase ID token for API requests
 */

"use client"

import { auth } from '@/infrastructure/firebase/firebase-client'

/**
 * Get Firebase ID token for authenticated user
 * @returns ID token string or null if not authenticated
 */
export async function getIdToken(): Promise<string | null> {
  try {
    const user = auth.currentUser
    if (!user) {
      return null
    }
    return await user.getIdToken()
  } catch (error) {
    console.error('Error getting ID token:', error)
    return null
  }
}

/**
 * Get headers with Authorization token for API requests
 * @returns Headers object with Authorization header
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getIdToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

