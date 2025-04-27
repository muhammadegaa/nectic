"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export interface User {
  uid: string
  email: string
  displayName?: string
  createdAt: any
  lastLogin: any
  industry?: string
  companySize?: string
  role?: string
  systemsConnected: {
    salesforce: boolean
    microsoft365: boolean
    quickbooks: boolean
  }
  subscription: {
    tier: "free" | "standard" | "premium"
    expiresAt?: any
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    status?: string
    cancelAtPeriodEnd?: boolean
    currentPeriodEnd?: any
    lastPaymentDate?: any
    paymentMethodId?: string
    setupComplete?: boolean
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, displayName: string, plan?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (data: Partial<User>) => Promise<void>
  bypassAuth: boolean
  enableBypass: () => void
  disableBypass: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create a mock timestamp
const createMockTimestamp = () => {
  return {
    toDate: () => new Date(),
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0,
    isEqual: () => false,
    valueOf: () => Date.now(),
  }
}

// Create a mock user for bypass mode
const createMockUser = () => {
  return {
    uid: "bypass-user",
    email: "bypass@example.com",
    displayName: "Bypass User",
    createdAt: createMockTimestamp(),
    lastLogin: createMockTimestamp(),
    systemsConnected: {
      salesforce: true,
      microsoft365: true,
      quickbooks: true,
    },
    subscription: {
      tier: "premium",
      setupComplete: true,
    },
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [bypassAuth, setBypassAuth] = useState<boolean>(false)
  const router = useRouter()

  // Check for bypass mode on initial load
  useEffect(() => {
    const checkBypassMode = () => {
      try {
        if (typeof window !== "undefined") {
          const bypass = localStorage.getItem("bypassAuth") === "true"
          console.log("Bypass auth check:", bypass)

          if (bypass) {
            setBypassAuth(true)
            setUser(createMockUser())
            console.log("Bypass user set:", createMockUser())
          }

          setLoading(false)
        }
      } catch (error) {
        console.error("Error checking bypass mode:", error)
        setLoading(false)
      }
    }

    checkBypassMode()
  }, [])

  // This function would normally create a timestamp
  const createTimestamp = () => {
    return {
      toDate: () => new Date(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
    }
  }

  // Mock user database
  const mockUserDB: Record<string, User> = {}

  const signUp = async (email: string, password: string, displayName: string, plan = "free") => {
    try {
      setLoading(true)

      // Generate a unique ID
      const uid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      // Create user data
      const userData: User = {
        uid,
        email,
        displayName,
        createdAt: createTimestamp(),
        lastLogin: createTimestamp(),
        systemsConnected: {
          salesforce: false,
          microsoft365: false,
          quickbooks: false,
        },
        subscription: {
          tier: plan as "free" | "standard" | "premium",
          expiresAt:
            plan !== "free"
              ? {
                  toDate: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  seconds: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
                  nanoseconds: 0,
                }
              : undefined,
        },
      }

      // Save user data to mock DB
      mockUserDB[uid] = userData

      setUser(userData)
      router.push("/dashboard")
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)

      // In a real implementation, you would validate credentials
      // For now, we'll just create a mock user
      const uid = `user-${email.replace(/[^a-zA-Z0-9]/g, "-")}`

      // Check if user exists in mock DB
      if (!mockUserDB[uid]) {
        // Create a new user if not found
        mockUserDB[uid] = {
          uid,
          email,
          displayName: email.split("@")[0],
          createdAt: createTimestamp(),
          lastLogin: createTimestamp(),
          systemsConnected: {
            salesforce: false,
            microsoft365: false,
            quickbooks: false,
          },
          subscription: {
            tier: "free",
          },
        }
      }

      // Update last login
      mockUserDB[uid].lastLogin = createTimestamp()

      setUser(mockUserDB[uid])
      router.push("/dashboard")
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)

      // Create a mock Google user
      const uid = "google-user"

      // Check if user exists in mock DB
      if (!mockUserDB[uid]) {
        // Create a new user if not found
        mockUserDB[uid] = {
          uid,
          email: "google-user@example.com",
          displayName: "Google User",
          createdAt: createTimestamp(),
          lastLogin: createTimestamp(),
          systemsConnected: {
            salesforce: false,
            microsoft365: false,
            quickbooks: false,
          },
          subscription: {
            tier: "free",
          },
        }
      }

      // Update last login
      mockUserDB[uid].lastLogin = createTimestamp()

      setUser(mockUserDB[uid])
      router.push("/dashboard")
    } catch (error) {
      console.error("Error signing in with Google:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)

      // If in bypass mode, just remove the bypass flag
      if (bypassAuth) {
        localStorage.removeItem("bypassAuth")
        localStorage.removeItem("bypassAuthInit")
        setBypassAuth(false)
        setUser(null)
        router.push("/")
        return
      }

      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user && !bypassAuth) throw new Error("No user logged in")

    try {
      // If in bypass mode, just update the local state
      if (bypassAuth) {
        setUser((prev) => (prev ? { ...prev, ...data } : null))
        return
      }

      // Update user data in mock DB
      if (user) {
        mockUserDB[user.uid] = { ...mockUserDB[user.uid], ...data }

        // Update local state
        setUser((prev) => (prev ? { ...prev, ...data } : null))
      }
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  const enableBypass = () => {
    try {
      console.log("Enabling bypass mode")

      // Clear any existing bypass initialization
      localStorage.removeItem("bypassAuthInit")

      // Set the bypass flag
      localStorage.setItem("bypassAuth", "true")

      // Create and set the mock user
      const mockUser = createMockUser()

      // Update state
      setBypassAuth(true)
      setUser(mockUser)
      router.push("/dashboard")

      console.log("Bypass mode enabled successfully, user:", mockUser)
    } catch (error) {
      console.error("Error enabling bypass:", error)
    }
  }

  const disableBypass = () => {
    try {
      localStorage.removeItem("bypassAuth")
      localStorage.removeItem("bypassAuthInit")
      setBypassAuth(false)
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Error disabling bypass:", error)
    }
  }

  // Debug output
  console.log("Auth context state:", {
    user: user ? `${user.displayName} (${user.email})` : null,
    bypassAuth,
    loading,
  })

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    updateUserProfile,
    bypassAuth,
    enableBypass,
    disableBypass,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
