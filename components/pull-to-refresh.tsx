"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ArrowDown, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  className?: string
  pullDistance?: number
  refreshingText?: string
  pullingText?: string
  releaseText?: string
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  pullDistance = 80,
  refreshingText = "Refreshing...",
  pullingText = "Pull to refresh",
  releaseText = "Release to refresh",
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullY, setPullY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)

  const handleTouchStart = (e: TouchEvent) => {
    // Only enable pull-to-refresh when at the top of the page
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current

    // Only allow pulling down, not up
    if (diff > 0) {
      // Apply resistance to make it harder to pull
      const resistance = 0.4
      const newPullY = Math.min(diff * resistance, pullDistance * 1.5)
      setPullY(newPullY)

      // Prevent default scrolling behavior
      e.preventDefault()
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling) return

    setIsPulling(false)

    if (pullY >= pullDistance) {
      // Trigger refresh
      setIsRefreshing(true)
      setPullY(pullDistance / 2) // Keep indicator partially visible during refresh

      try {
        await onRefresh()
      } catch (error) {
        console.error("Refresh failed:", error)
      }

      setIsRefreshing(false)
    }

    // Reset pull distance with animation
    setPullY(0)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("touchstart", handleTouchStart, { passive: false })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isPulling, pullY])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <motion.div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
        style={{ top: -60 + pullY }}
        animate={{ opacity: pullY > 0 ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-white rounded-full shadow-md p-3 flex items-center gap-2">
          {isRefreshing ? (
            <RefreshCw className="h-5 w-5 animate-spin text-amber-600" />
          ) : (
            <ArrowDown
              className={cn(
                "h-5 w-5 text-amber-600 transition-transform",
                pullY >= pullDistance && "transform rotate-180",
              )}
            />
          )}
          <span className="text-sm font-medium">
            {isRefreshing ? refreshingText : pullY >= pullDistance ? releaseText : pullingText}
          </span>
        </div>
      </motion.div>

      <motion.div style={{ y: pullY }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        {children}
      </motion.div>
    </div>
  )
}
