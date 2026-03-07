"use client"

import type { HealthHistoryEntry } from "@/lib/concept-firestore"

interface SparklineProps {
  history: HealthHistoryEntry[]
  width?: number
  height?: number
  className?: string
}

export function HealthSparkline({ history, width = 64, height = 24, className = "" }: SparklineProps) {
  if (!history || history.length < 2) return null

  const scores = history.map((h) => h.score)
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1

  const points = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * width
    const y = height - ((s - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })

  const polyline = points.join(" ")

  // Determine trend color
  const first = scores[0]
  const last = scores[scores.length - 1]
  const delta = last - first
  const color = delta > 0 ? "#10b981" : delta < 0 ? "#ef4444" : "#a3a3a3"

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {/* Last point dot */}
      <circle
        cx={width}
        cy={parseFloat(points[points.length - 1].split(",")[1])}
        r="2"
        fill={color}
      />
    </svg>
  )
}
