"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle, Clock, Database, Wrench, FileSearch, MessageSquare, Download, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, formatDistanceToNow } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { AppNavigation } from "@/components/app-navigation"
import type { Agent } from "@/domain/entities/agent.entity"

interface AuditLog {
  id: string
  type: 'data_access' | 'tool_call'
  agentId: string
  userId: string
  source: string
  toolName?: string
  collection?: string
  success?: boolean
  denied?: boolean
  timestamp: string
  inputSummary?: string
  rowCount?: number
  errorMessage?: string
  durationMs?: number
}

export default function AgentAuditPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const agentId = params.id as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'tool_call' | 'data_access'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(50)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
      return
    }
    if (user && agentId) {
      fetchAgent()
      fetchLogs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, user, authLoading, filterType, dateFilter])

  const fetchAgent = async () => {
    try {
      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/agents/${agentId}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setAgent(data)
      }
    } catch (error) {
      console.error('Failed to fetch agent:', error)
    }
  }

  const fetchLogs = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('type', filterType)
      if (dateFilter !== 'all') {
        const now = new Date()
        let startDate: Date
        if (dateFilter === 'today') {
          startDate = new Date(now.setHours(0, 0, 0, 0))
        } else if (dateFilter === 'week') {
          startDate = new Date(now.setDate(now.getDate() - 7))
        } else if (dateFilter === 'month') {
          startDate = new Date(now.setMonth(now.getMonth() - 1))
        } else {
          startDate = new Date(0)
        }
        params.append('startDate', startDate.toISOString())
      }
      params.append('limit', limit.toString())
      
      const response = await fetch(`/api/agents/${agentId}/audit?${params.toString()}`, { headers })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle specific error cases
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        if (response.status === 403) {
          throw new Error('You do not have access to this agent')
        }
        if (response.status === 404) {
          throw new Error('Agent not found')
        }
        
        throw new Error(errorData.error || 'Failed to fetch audit logs')
      }

      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load audit logs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (log: AuditLog) => {
    if (log.denied) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    if (log.success === false) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    if (log.success === true) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    }
    return <Clock className="h-4 w-4 text-gray-400" />
  }

  const getTypeIcon = (log: AuditLog) => {
    if (log.type === 'tool_call') {
      return <Wrench className="h-4 w-4 text-blue-500" />
    }
    return <Database className="h-4 w-4 text-purple-500" />
  }

  const truncateText = (text: string | undefined, maxLength: number = 50) => {
    if (!text) return '-'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const exportLogs = (format: 'csv' | 'json') => {
    if (logs.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no audit logs to export.",
        variant: "destructive",
      })
      return
    }

    if (format === 'csv') {
      const headers = ['Time', 'Type', 'Source', 'Tool Name', 'Collection', 'Status', 'Duration (ms)', 'Rows', 'Error']
      const rows = logs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.type,
        log.source,
        log.toolName || '',
        log.collection || '',
        log.denied ? 'Denied' : log.success ? 'Success' : 'Unknown',
        log.durationMs?.toString() || '',
        log.rowCount?.toString() || '',
        log.errorMessage || ''
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${agent?.name || 'agent'}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Export successful",
        description: "Audit logs exported as CSV",
      })
    } else {
      const jsonContent = JSON.stringify(logs, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${agent?.name || 'agent'}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Export successful",
        description: "Audit logs exported as JSON",
      })
    }
  }

  const filteredLogs = logs.filter(log => {
    if (dateFilter === 'all') return true
    const logDate = new Date(log.timestamp)
    const now = new Date()
    
    if (dateFilter === 'today') {
      const today = new Date(now.setHours(0, 0, 0, 0))
      return logDate >= today
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7))
      return logDate >= weekAgo
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
      return logDate >= monthAgo
    }
    return true
  })

  const totalPages = Math.ceil(filteredLogs.length / limit)
  const startIndex = (currentPage - 1) * limit
  const endIndex = startIndex + limit
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        <Skeleton className="h-8 sm:h-12 w-48 sm:w-64 mb-4 sm:mb-6" />
        <Skeleton className="h-64 sm:h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Agent", href: `/agents/${agentId}/chat` },
        { label: "Audit Logs" }
      ]} />
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Link href={`/agents/${agentId}/chat`}>
          <Button variant="ghost" size="sm" className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold truncate">
            Audit Logs
            {agent && <span className="text-muted-foreground ml-2">- {agent.name}</span>}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            View all data access and tool execution logs for this agent
          </p>
        </div>
      </div>

      <div className="mb-4 sm:mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <Tabs value={filterType} onValueChange={(v) => {
            setFilterType(v as typeof filterType)
            setCurrentPage(1)
          }}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all" className="flex-1 sm:flex-none">All</TabsTrigger>
              <TabsTrigger value="tool_call" className="flex-1 sm:flex-none">Tool Calls</TabsTrigger>
              <TabsTrigger value="data_access" className="flex-1 sm:flex-none">Data Access</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as typeof dateFilter)
                setCurrentPage(1)
              }}
              className="flex h-9 w-full sm:w-[140px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            
            {logs.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportLogs('csv')}
                  className="h-9"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportLogs('json')}
                  className="h-9"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export JSON</span>
                  <span className="sm:hidden">JSON</span>
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {filteredLogs.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} logs
          </div>
        )}
      </div>

      <Card className="p-4 sm:p-6">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <FileSearch className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No audit logs yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Audit logs will appear here once your agent starts performing actions, accessing data, or executing tools.
            </p>
            <Link href={`/agents/${agentId}/chat`}>
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start a conversation
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium">Time</th>
                    <th className="text-left p-3 text-sm font-medium">Type</th>
                    <th className="text-left p-3 text-sm font-medium">Source</th>
                    <th className="text-left p-3 text-sm font-medium">Details</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-left p-3 text-sm font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">
                        <div className="flex flex-col">
                          <span>{format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(log)}
                          <span className="capitalize">{log.type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <span className="capitalize">{log.source}</span>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex flex-col gap-1">
                          {log.toolName && (
                            <span className="font-medium">Tool: {log.toolName}</span>
                          )}
                          {log.collection && (
                            <span className="text-muted-foreground">Collection: {log.collection}</span>
                          )}
                          {log.inputSummary && (
                            <span className="text-xs text-muted-foreground" title={log.inputSummary}>
                              {truncateText(log.inputSummary, 40)}
                            </span>
                          )}
                          {log.rowCount !== undefined && log.rowCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Rows: {log.rowCount}
                            </span>
                          )}
                          {log.errorMessage && (
                            <span className="text-xs text-red-500" title={log.errorMessage}>
                              Error: {truncateText(log.errorMessage, 40)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log)}
                          <span className={log.denied ? 'text-red-500' : log.success ? 'text-green-500' : 'text-gray-500'}>
                            {log.denied ? 'Denied' : log.success ? 'Success' : 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {log.durationMs !== undefined ? `${log.durationMs}ms` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {paginatedLogs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getTypeIcon(log)}
                        <span className="text-sm font-medium capitalize truncate">{log.type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusIcon(log)}
                        <span className={`text-xs ${log.denied ? 'text-red-500' : log.success ? 'text-green-500' : 'text-gray-500'}`}>
                          {log.denied ? 'Denied' : log.success ? 'Success' : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Time</span>
                        <div className="text-right">
                          <div className="text-xs">{format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Source</span>
                        <span className="capitalize">{log.source}</span>
                      </div>
                      
                      {log.toolName && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Tool</span>
                          <span className="font-medium truncate ml-2">{log.toolName}</span>
                        </div>
                      )}
                      
                      {log.collection && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Collection</span>
                          <span className="truncate ml-2">{log.collection}</span>
                        </div>
                      )}
                      
                      {log.rowCount !== undefined && log.rowCount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Rows</span>
                          <span>{log.rowCount}</span>
                        </div>
                      )}
                      
                      {log.durationMs !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Duration</span>
                          <span>{log.durationMs}ms</span>
                        </div>
                      )}
                      
                      {log.inputSummary && (
                        <div className="pt-2 border-t border-border">
                          <div className="text-xs text-muted-foreground mb-1">Input</div>
                          <div className="text-xs break-words">{log.inputSummary}</div>
                        </div>
                      )}
                      
                      {log.errorMessage && (
                        <div className="pt-2 border-t border-border">
                          <div className="text-xs text-red-500 font-medium mb-1">Error</div>
                          <div className="text-xs text-red-500 break-words">{log.errorMessage}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-9"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-9"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
      </div>
    </div>
  )
}

