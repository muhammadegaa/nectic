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
    const unsubscribe = onAuthStateChangedHelper((authUser) => {
      if (isMounted) {
        setUser(authUser)
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
      unsubscribe()
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
