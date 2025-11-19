"use client"

import { useState, KeyboardEvent } from "react"

export function useBypassAuth() {
  const [doubleClicked, setDoubleClicked] = useState(false)
  const [secretCode] = useState("")

  const handleDoubleClick = () => {
    setDoubleClicked(true)
    setTimeout(() => setDoubleClicked(false), 3000)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    // Handle any special key combinations if needed
  }

  return {
    doubleClicked,
    secretCode,
    handleDoubleClick,
    handleKeyDown,
  }
}

