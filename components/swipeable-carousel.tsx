"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SwipeableCarouselProps {
  children: React.ReactNode[]
  className?: string
  showArrows?: boolean
  showDots?: boolean
  autoplay?: boolean
  autoplayInterval?: number
  loop?: boolean
}

export function SwipeableCarousel({
  children,
  className,
  showArrows = true,
  showDots = true,
  autoplay = false,
  autoplayInterval = 5000,
  loop = false,
}: SwipeableCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  const totalItems = children.length

  // Handle autoplay
  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev === totalItems - 1) {
          return loop ? 0 : prev
        }
        return prev + 1
      })
    }, autoplayInterval)

    return () => clearInterval(interval)
  }, [autoplay, autoplayInterval, totalItems, loop])

  // Handle navigation
  const goToSlide = (index: number) => {
    let newIndex = index

    if (index < 0) {
      newIndex = loop ? totalItems - 1 : 0
    } else if (index >= totalItems) {
      newIndex = loop ? 0 : totalItems - 1
    }

    setActiveIndex(newIndex)
  }

  // Handle touch events
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

    if (isLeftSwipe) {
      goToSlide(activeIndex + 1)
    } else if (isRightSwipe) {
      goToSlide(activeIndex - 1)
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className="overflow-hidden"
        ref={carouselRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {children.map((child, index) => (
            <div key={index} className="w-full flex-shrink-0">
              {child}
            </div>
          ))}
        </div>
      </div>

      {showArrows && totalItems > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm z-10"
            onClick={() => goToSlide(activeIndex - 1)}
            disabled={!loop && activeIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm z-10"
            onClick={() => goToSlide(activeIndex + 1)}
            disabled={!loop && activeIndex === totalItems - 1}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
        </>
      )}

      {showDots && totalItems > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: totalItems }).map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                activeIndex === index ? "bg-amber-600 w-4" : "bg-gray-300",
              )}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
