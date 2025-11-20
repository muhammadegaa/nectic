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
    
    // Wait for auth state to be restored from persistence
    // This is critical for enterprise users who expect sessions to persist
    const unsubscribe = onAuthStateChangedHelper((user) => {
      if (isMounted) {
        setUser(user)
        setLoading(false)
      }
    })

    // Also check if there's a current user immediately (in case onAuthStateChanged hasn't fired yet)
    // This helps with faster initial load
    const checkCurrentUser = async () => {
      // Give Firebase time to restore from localStorage (up to 1 second)
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const { auth } = await import('@/infrastructure/firebase/firebase-client')
        if (auth.currentUser && isMounted) {
          setUser(auth.currentUser)
          setLoading(false)
          return
        }
      }
      
      // If still no user after 1 second, mark as loaded (user is truly not authenticated)
      if (isMounted) {
        setLoading(false)
      }
    }
    
    // Run check immediately to allow persistence to restore
    checkCurrentUser()

    return () => {
      isMounted = false
      unsubscribe()
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

