"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

export function useBypassAuth() {
  const [doubleClicked, setDoubleClicked] = useState(false)
  const [secretCode, setSecretCode] = useState("")
  const router = useRouter()

  // Check if we're in a browser environment
  const isBrowser = typeof window !== "undefined"

  // Function to enable bypass mode
  const enableBypassMode = useCallback(() => {
    if (isBrowser) {
      try {
        // Just set a flag that we're in bypass mode initialization
        localStorage.setItem("bypassAuthInit", "true")
        console.log("Bypass auth initialization")
        router.push("/login")
      } catch (error) {
        console.error("Error setting bypass auth init:", error)
      }
    }
  }, [router, isBrowser])

  // Handle double click on header
  const handleDoubleClick = useCallback(() => {
    setDoubleClicked(true)
    setSecretCode("")
  }, [])

  // Handle key press for secret code
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!doubleClicked) return

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
    [doubleClicked, secretCode, enableBypassMode],
  )

  // Function to complete the bypass auth process
  const completeBypassAuth = useCallback(() => {
    if (isBrowser) {
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
  }, [router, isBrowser])

  // Reset double clicked state when clicking outside
  useEffect(() => {
    if (!doubleClicked) return

    const handleClickOutside = () => {
      setDoubleClicked(false)
      setSecretCode("")
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [doubleClicked])

  return {
    doubleClicked,
    secretCode,
    handleDoubleClick,
    handleKeyDown,
    completeBypassAuth,
    isInitializing: isBrowser ? localStorage.getItem("bypassAuthInit") === "true" : false,
  }
}

// This file provides utility functions for bypassing authentication in development

export const enableBypassAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem("bypassAuth", "true")
    console.log("Bypass auth enabled")

    // Force reload to apply changes
    window.location.href = "/dashboard"
  }
}

export const disableBypassAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("bypassAuth")
    localStorage.removeItem("bypassAuthInit")
    console.log("Bypass auth disabled")

    // Force reload to apply changes
    window.location.href = "/"
  }
}

export const isBypassAuthEnabled = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("bypassAuth") === "true"
  }
  return false
}
