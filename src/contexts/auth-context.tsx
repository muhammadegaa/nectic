"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { User as FirebaseUser } from "firebase/auth"
import {
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  onAuthStateChangedHelper,
} from "@/infrastructure/firebase/firebase-client"

interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null
    let hasReceivedAuthState = false
    
    // Wait for auth state to be restored from persistence
    // This is critical for enterprise users who expect sessions to persist
    const unsubscribe = onAuthStateChangedHelper((user) => {
      hasReceivedAuthState = true
      
      if (isMounted) {
        setUser(user)
        
        // Only set loading to false after we've received auth state AND waited a bit
        // This ensures persistence has time to restore
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        // Wait a bit more to ensure persistence is fully restored
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setLoading(false)
          }
        }, 300) // Small delay to ensure persistence is fully restored
      }
    })

    // Set a timeout to mark as loaded even if onAuthStateChanged hasn't fired
    // This prevents infinite loading states, but give it time for persistence
    timeoutId = setTimeout(() => {
      if (isMounted) {
        // Check one final time if currentUser exists (persistence might have restored it)
        import('@/infrastructure/firebase/firebase-client').then(({ auth }) => {
          if (isMounted) {
            if (auth.currentUser) {
              setUser(auth.currentUser)
            }
            setLoading(false)
          }
        })
      }
    }, 3000) // Wait up to 3 seconds for persistence to restore

    return () => {
      isMounted = false
      unsubscribe()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error("Error signing in with Google:", error)
      throw error
    }
  }

  const handleSignUpWithEmail = async (email: string, password: string) => {
    try {
      await signUpWithEmail(email, password)
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    }
  }

  const handleSignInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password)
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutUser()
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle: handleSignInWithGoogle,
        signUpWithEmail: handleSignUpWithEmail,
        signInWithEmail: handleSignInWithEmail,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

