"use client"

import { useState, useEffect } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts"
import type { PieLabelRenderProps } from "recharts"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, PieChartIcon, LineChartIcon, AreaChartIcon } from "lucide-react"

interface ChartData {
  name: string
  value: number
  color?: string
  [key: string]: any
}

interface ResponsiveChartProps {
  data: ChartData[]
  title: string
  subtitle?: string
  height?: number
  showLegend?: boolean
  availableChartTypes?: Array<"bar" | "pie" | "line" | "area">
  defaultType?: "bar" | "pie" | "line" | "area"
  dataKeys?: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  isLoading?: boolean
}

export function ResponsiveChart({
  data,
  title,
  subtitle,
  height = 300,
  showLegend = true,
  availableChartTypes = ["bar", "pie"],
  defaultType = "bar",
  dataKeys = ["value"],
  colors = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"],
  valueFormatter,
  isLoading = false,
}: ResponsiveChartProps) {
  const [chartType, setChartType] = useState<"bar" | "pie" | "line" | "area">(defaultType)
  const isMobile = useMediaQuery("(max-width: 640px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")
  const [initialChartType, setInitialChartType] = useState<"bar" | "pie" | "line" | "area">(defaultType)

  useEffect(() => {
    if (isMobile && availableChartTypes.includes("pie")) {
      setInitialChartType("pie")
    } else if (!isMobile && !availableChartTypes.includes(initialChartType)) {
      setInitialChartType(availableChartTypes[0])
    } else {
      setInitialChartType(defaultType)
    }
  }, [isMobile, availableChartTypes, defaultType])

  useEffect(() => {
    setChartType(initialChartType)
  }, [initialChartType])

  useEffect(() => {
    // Force a resize event after component mounts to ensure charts render properly
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 200)

    return () => clearTimeout(timer)
  }, [])

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full flex items-center justify-center" style={{ height }}>
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Format large numbers
  const formatValue = (value: number) => {
    if (valueFormatter) {
      return valueFormatter(value)
    }

    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  // Get colors for chart
  const getColor = (index: number, key?: string) => {
    if (key && data[0][key] && data[0][key].color) {
      return data[index][key].color
    }

    if (data[index]?.color) {
      return data[index].color
    }

    return colors[index % colors.length]
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border shadow-sm rounded-md text-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill || entry.stroke }}
              />
              <span>
                {entry.name || entry.dataKey}: {formatValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }

    return null
  }

  // Custom pie chart label
  const renderPieLabel = (props: PieLabelRenderProps) => {
    if (isMobile) return null

    const name = typeof props.name === "string" ? props.name : ""
    const value = typeof props.percent === "number" ? props.percent : 0

    return `${name}: ${(value * 100).toFixed(0)}%`
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="w-full" style={{ height }} />
        {showLegend && (
          <div className="mt-4 flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1">
            {availableChartTypes.includes("bar") && (
              <Button
                variant={chartType === "bar" ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setChartType("bar")}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="sr-only">Bar Chart</span>
              </Button>
            )}
            {availableChartTypes.includes("pie") && (
              <Button
                variant={chartType === "pie" ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setChartType("pie")}
              >
                <PieChartIcon className="h-4 w-4" />
                <span className="sr-only">Pie Chart</span>
              </Button>
            )}
            {availableChartTypes.includes("line") && (
              <Button
                variant={chartType === "line" ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setChartType("line")}
              >
                <LineChartIcon className="h-4 w-4" />
                <span className="sr-only">Line Chart</span>
              </Button>
            )}
            {availableChartTypes.includes("area") && (
              <Button
                variant={chartType === "area" ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setChartType("area")}
              >
                <AreaChartIcon className="h-4 w-4" />
                <span className="sr-only">Area Chart</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" && (
              <BarChart
                data={data}
                layout={isMobile ? "vertical" : "horizontal"}
                margin={
                  isMobile ? { top: 5, right: 10, left: 0, bottom: 5 } : { top: 5, right: 30, left: 20, bottom: 5 }
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                {isMobile ? (
                  <>
                    <XAxis type="number" tickFormatter={formatValue} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => (value.length > 15 ? `${value.substring(0, 15)}...` : value)}
                    />
                  </>
                ) : (
                  <>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        isTablet && value.length > 10 ? `${value.substring(0, 10)}...` : value
                      }
                    />
                    <YAxis tickFormatter={formatValue} />
                  </>
                )}
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
                {dataKeys.map((key, index) => (
                  <Bar key={key} dataKey={key} fill={getColor(index, key)} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            )}

            {chartType === "pie" && (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={!isMobile}
                  outerRadius={isMobile ? 80 : 100}
                  dataKey={dataKeys[0]}
                  nameKey="name"
                  label={renderPieLabel}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(index)} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
              </PieChart>
            )}

            {chartType === "line" && (
              <LineChart
                data={data}
                margin={
                  isMobile ? { top: 5, right: 10, left: 0, bottom: 5 } : { top: 5, right: 30, left: 20, bottom: 5 }
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => (isTablet && value.length > 10 ? `${value.substring(0, 10)}...` : value)}
                />
                <YAxis tickFormatter={formatValue} />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
                {dataKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={getColor(index, key)}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            )}

            {chartType === "area" && (
              <AreaChart
                data={data}
                margin={
                  isMobile ? { top: 5, right: 10, left: 0, bottom: 5 } : { top: 5, right: 30, left: 20, bottom: 5 }
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => (isTablet && value.length > 10 ? `${value.substring(0, 10)}...` : value)}
                />
                <YAxis tickFormatter={formatValue} />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
                {dataKeys.map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={getColor(index, key)}
                    fill={`${getColor(index, key)}33`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>

      {showLegend && !isMobile && (
        <CardFooter className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(index) }} />
                <span className="text-sm truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
