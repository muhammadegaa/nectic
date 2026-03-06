"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { User as FirebaseUser } from "firebase/auth"
import {
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  onAuthStateChangedHelper,
  finishGoogleRedirect,
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
    let unsubscribeAuth: (() => void) | null = null
    let fallback: ReturnType<typeof setTimeout> | null = null

    // Firebase requires getRedirectResult() on every page load when using
    // signInWithRedirect. Without it, onAuthStateChanged waits indefinitely
    // when a pending redirect result exists.
    finishGoogleRedirect()
      .catch(() => {})
      .finally(() => {
        if (!isMounted) return

        unsubscribeAuth = onAuthStateChangedHelper((authUser) => {
          if (isMounted) {
            setUser(authUser)
            setLoading(false)
          }
        })

        // Safety fallback — never hang loading forever
        fallback = setTimeout(() => {
          if (isMounted) setLoading(false)
        }, 5000)
      })

    return () => {
      isMounted = false
      unsubscribeAuth?.()
      if (fallback !== null) clearTimeout(fallback)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle: async () => { await signInWithGoogle() },
        signUpWithEmail: async (email, password) => { await signUpWithEmail(email, password) },
        signInWithEmail: async (email, password) => { await signInWithEmail(email, password) },
        signOut: async () => { await signOutUser() },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
