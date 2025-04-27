"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface StatusData {
  status: string
  count: number
  percentage: number
  color: string
}

interface OpportunityStatusChartProps {
  data: StatusData[]
}

const OpportunityStatusChart: React.FC<OpportunityStatusChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !canvasRef.current || !data || data.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up dimensions
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    // Draw pie chart
    let startAngle = 0
    data.forEach((item) => {
      // Calculate end angle
      const sliceAngle = (item.percentage / 100) * 2 * Math.PI
      const endAngle = startAngle + sliceAngle

      // Draw slice
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      // Fill slice
      ctx.fillStyle = item.color
      ctx.fill()

      // Update start angle for next slice
      startAngle = endAngle
    })

    // Draw center circle (for donut effect)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI)
    ctx.fillStyle = "white"
    ctx.fill()
  }, [mounted, data])

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Opportunity Status</CardTitle>
          <CardDescription>Current status of all identified opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opportunity Status</CardTitle>
        <CardDescription>Current status of all identified opportunities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center mx-2">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
              <span>{item.status}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <canvas ref={canvasRef} width={300} height={300} className="max-w-full" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
              <span className="font-medium">{item.status}</span>
              <span className="ml-auto">
                {item.percentage.toFixed(1)}% ({item.count})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default OpportunityStatusChart
