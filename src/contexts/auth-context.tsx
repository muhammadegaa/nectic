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
    
    console.log('[AuthProvider] Initializing auth state listener')
    
    // Wait for auth state to be restored from persistence
    // This is critical for enterprise users who expect sessions to persist
    const unsubscribe = onAuthStateChangedHelper((user) => {
      console.log('[AuthProvider] onAuthStateChanged fired, user:', user?.uid || 'null')
      
      if (isMounted) {
        setUser(user)
        
        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        // Set loading to false immediately when we get auth state
        // The user object will be set, and if it's null, that's the actual state
        setLoading(false)
      }
    })

    // Fallback timeout - if onAuthStateChanged doesn't fire within 2 seconds,
    // check currentUser directly and mark as loaded
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log('[AuthProvider] Timeout reached, checking currentUser')
        import('@/infrastructure/firebase/firebase-client').then(({ auth }) => {
          if (isMounted) {
            console.log('[AuthProvider] currentUser:', auth.currentUser?.uid || 'null')
            if (auth.currentUser) {
              setUser(auth.currentUser)
            }
            setLoading(false)
          }
        })
      }
    }, 2000)

    return () => {
      console.log('[AuthProvider] Cleaning up')
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

