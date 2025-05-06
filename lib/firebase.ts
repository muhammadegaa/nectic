"use client"

import { useState, useEffect } from "react"
import { getFirebaseServices, serverTimestamp } from "./firebase-client"

// Hook to ensure Firebase is initialized
const useFirebase = () => {
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [services, setServices] = useState(() => getFirebaseServices())

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    let isMounted = true

    // Add a small delay to ensure DOM is fully loaded
    const initTimer = setTimeout(() => {
      try {
        // Try to initialize Firebase if not already initialized
        const { app, auth, db } = getFirebaseServices()

        if (isMounted) {
          if (app) {
            setServices({ app, auth, db, googleProvider: services.googleProvider })
            setInitialized(true)
            console.log("Firebase services are available")
          } else {
            console.warn("Firebase app is not available")
            setError(new Error("Firebase app not initialized"))
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error initializing Firebase services:", err)
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }, 100)

    return () => {
      isMounted = false
      clearTimeout(initTimer)
    }
  }, [])

  return {
    initialized,
    error,
    ...services,
  }
}

// Export the hook
export { useFirebase }

// Export for compatibility
export { serverTimestamp }
export const { app, auth, db, googleProvider } = getFirebaseServices()
