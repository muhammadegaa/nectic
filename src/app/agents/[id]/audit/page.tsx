"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle, Clock, Database, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, formatDistanceToNow } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
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
  }, [agentId, user, authLoading, filterType])

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
      const typeParam = filterType === 'all' ? '' : `?type=${filterType}`
      const response = await fetch(`/api/agents/${agentId}/audit${typeParam}`, { headers })
      
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

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
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

      <div className="mb-4 sm:mb-6">
        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-none">All</TabsTrigger>
            <TabsTrigger value="tool_call" className="flex-1 sm:flex-none">Tool Calls</TabsTrigger>
            <TabsTrigger value="data_access" className="flex-1 sm:flex-none">Data Access</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="p-4 sm:p-6">
        {logs.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-muted-foreground">
            <p className="text-sm sm:text-base">No audit logs found</p>
            <p className="text-xs sm:text-sm mt-2">Logs will appear here after the agent performs actions</p>
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
                  {logs.map((log) => (
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
              {logs.map((log) => (
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
          </>
        )}
      </Card>
    </div>
  )
}

