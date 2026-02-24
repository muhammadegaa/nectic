"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Database, Loader2 } from "lucide-react"

interface CollectionPreview {
  id: string
  label: string
  countEstimate?: number | null
  sample: Array<Record<string, any>>
  error?: string
}

interface DataPreviewProps {
  selectedCollections: string[]
}

export function DataPreview({ selectedCollections }: DataPreviewProps) {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [previews, setPreviews] = useState<CollectionPreview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // If no collections selected, clear previews
    if (selectedCollections.length === 0) {
      setPreviews([])
      return
    }

    // Wait for auth to be ready
    if (authLoading || !user) {
      return
    }

    // Debounce API call
    const timer = setTimeout(() => {
      fetchPreviews(selectedCollections)
    }, 300)

    setDebounceTimer(timer)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [selectedCollections, user, authLoading])

  const fetchPreviews = async (collections: string[]) => {
    if (!user || collections.length === 0) {
      setPreviews([])
      return
    }

    setIsLoading(true)
    try {
      const { getAuthHeaders } = await import('@/lib/auth-client')
      
      // Retry logic for auth - sometimes token needs a moment to be ready
      let authHeaders: HeadersInit | null = null
      let retries = 3
      
      while (retries > 0 && !authHeaders) {
        try {
          authHeaders = await getAuthHeaders()
        } catch (authError: any) {
          retries--
          if (retries > 0) {
            // Wait a bit and retry
            await new Promise(resolve => setTimeout(resolve, 200))
          } else {
            throw authError
          }
        }
      }
      
      if (!authHeaders) {
        throw new Error("Failed to get authentication token")
      }
      
      const response = await fetch("/api/data-preview", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          collections,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.")
        }
        throw new Error(errorData.message || errorData.error || "Failed to fetch data preview")
      }

      const data = await response.json()
      setPreviews(data.collections || [])
    } catch (error: any) {
      console.error("Error fetching data preview:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load data preview",
        variant: "destructive",
      })
      setPreviews([])
    } finally {
      setIsLoading(false)
    }
  }

  if (selectedCollections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Preview
          </CardTitle>
          <CardDescription>
            Select a data source to see a preview of what your agent can access.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Preview
        </CardTitle>
        <CardDescription>
          Sample data from selected collections ({selectedCollections.length} selected)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : previews.length === 0 ? (
          <p className="text-sm text-foreground/60">No preview available</p>
        ) : (
          <div className="space-y-6">
            {previews.map((preview) => (
              <div key={preview.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">{preview.label}</h4>
                  {preview.countEstimate !== null && preview.countEstimate !== undefined && (
                    <span className="text-xs text-foreground/60">
                      ~{preview.countEstimate.toLocaleString()} records
                    </span>
                  )}
                </div>

                {preview.error ? (
                  <p className="text-sm text-destructive">{preview.error}</p>
                ) : preview.sample.length === 0 ? (
                  <p className="text-sm text-foreground/60">No sample data available</p>
                ) : (
                  <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {Object.keys(preview.sample[0] || {}).map((key) => (
                            <th
                              key={key}
                              className="px-3 py-2 text-left font-medium text-foreground/80 text-xs"
                            >
                              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sample.map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                          >
                            {Object.keys(preview.sample[0] || {}).map((key) => (
                              <td key={key} className="px-3 py-2 text-foreground/70 text-xs">
                                {formatCellValue(row[key])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return "-"
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  if (typeof value === "number") {
    // Format numbers with commas
    if (Number.isInteger(value)) {
      return value.toLocaleString()
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (typeof value === "string") {
    // Truncate long strings
    if (value.length > 50) {
      return value.substring(0, 47) + "..."
    }
    // Format dates if they look like ISO dates
    if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        const date = new Date(value)
        return date.toLocaleDateString()
      } catch {
        return value
      }
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.join(", ")
  }
  return String(value)
}

