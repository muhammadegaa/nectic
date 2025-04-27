"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface MobileTabsProps {
  tabs: {
    id: string
    label: string
    icon?: React.ReactNode
  }[]
  activeTab: string
  onChange: (tabId: string) => void
  fullWidth?: boolean
  className?: string
}

export function MobileTabs({ tabs, activeTab, onChange, fullWidth = true, className }: MobileTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Scroll active tab into view
  useEffect(() => {
    if (tabsRef.current) {
      const activeTabElement = tabsRef.current.querySelector(`[data-tab-id="${activeTab}"]`)
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        })
      }
    }
  }, [activeTab])

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTab)
      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        onChange(tabs[currentIndex + 1].id)
      } else if (isRightSwipe && currentIndex > 0) {
        onChange(tabs[currentIndex - 1].id)
      }
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  return (
    <div
      className={cn("overflow-x-auto scrollbar-hide", className)}
      ref={tabsRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={cn("flex items-center border-b", fullWidth ? "w-full" : "w-max")}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
              fullWidth && "flex-1",
              activeTab === tab.id
                ? "text-amber-600 border-b-2 border-amber-600"
                : "text-gray-600 hover:text-amber-600",
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
