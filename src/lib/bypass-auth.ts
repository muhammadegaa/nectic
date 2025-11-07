"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ROUTES } from './routes'

export function useBypassAuth() {
  const [doubleClicked, setDoubleClicked] = useState(false)
  const [secretCode, setSecretCode] = useState("")
  const router = useRouter()

  // Check if we're in a browser environment and development mode
  const isBrowser = typeof window !== "undefined"
  const isDevelopment = process.env.NODE_ENV === "development"

  // Function to enable bypass mode
  const enableBypassMode = useCallback(() => {
    if (isBrowser && isDevelopment) {
      try {
        // Just set a flag that we're in bypass mode initialization
        localStorage.setItem("bypassAuthInit", "true")
        console.log("Bypass auth initialization")
        router.push(ROUTES.LOGIN)
      } catch (error) {
        console.error("Error setting bypass auth init:", error)
      }
    }
  }, [router, isBrowser, isDevelopment])

  // Handle double click on header
  const handleDoubleClick = useCallback(() => {
    if (isDevelopment) {
      setDoubleClicked(true)
      setSecretCode("")
    }
  }, [isDevelopment])

  // Handle key press for secret code
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!doubleClicked || !isDevelopment) return

      // Only handle alphanumeric keys
      if (/^[a-zA-Z0-9]$/.test(e.key)) {
        const newCode = secretCode + e.key
        setSecretCode(newCode)

        // Check if the code is "nectic"
        if (newCode.toLowerCase() === "nectic") {
          enableBypassMode()
        }
      }
    },
    [doubleClicked, secretCode, enableBypassMode, isDevelopment],
  )

  // Function to complete the bypass auth process
  const completeBypassAuth = useCallback(() => {
    if (isBrowser && isDevelopment) {
      try {
        localStorage.setItem("bypassAuth", "true")
        localStorage.removeItem("bypassAuthInit")
        console.log("Bypass auth completed")

        // Use a timeout to ensure state updates before navigation
        setTimeout(() => {
          router.push("/app")
        }, 100)
      } catch (error) {
        console.error("Error completing bypass auth:", error)
      }
    }
  }, [router, isBrowser, isDevelopment])

  // Reset double clicked state when clicking outside
  useEffect(() => {
    if (!doubleClicked || !isDevelopment) return

    const handleClickOutside = () => {
      setDoubleClicked(false)
      setSecretCode("")
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [doubleClicked, isDevelopment])

  return {
    doubleClicked,
    secretCode,
    handleDoubleClick,
    handleKeyDown,
    completeBypassAuth,
    isInitializing: isBrowser && isDevelopment ? localStorage.getItem("bypassAuthInit") === "true" : false,
  }
}

// This file provides utility functions for bypassing authentication in development

export const enableBypassAuth = () => {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    localStorage.setItem("bypassAuth", "true")
    console.log("Bypass auth enabled")

    // Force reload to apply changes
    window.location.href = "/dashboard"
  }
}

export const disableBypassAuth = () => {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    localStorage.removeItem("bypassAuth")
    localStorage.removeItem("bypassAuthInit")
    console.log("Bypass auth disabled")

    // Force reload to apply changes
    window.location.href = "/"
  }
}

export const isBypassAuthEnabled = () => {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    return localStorage.getItem("bypassAuth") === "true"
  }
  return false
}
