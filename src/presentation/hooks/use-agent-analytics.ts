/**
 * Hook to fetch agent analytics
 */

import { useState, useEffect } from 'react'
import type { AgentAnalytics } from '@/domain/entities/agent-analytics.entity'

export function useAgentAnalytics(agentId: string | null, enabled: boolean = true) {
  const [analytics, setAnalytics] = useState<AgentAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!agentId || !enabled) {
      setAnalytics(null)
      return
    }

    const fetchAnalytics = async () => {
      setLoading(true)
      setError(null)
      try {
        const { getAuthHeaders } = await import('@/lib/auth-client')
        const headers = await getAuthHeaders()
        const response = await fetch(`/api/agents/${agentId}/analytics`, {
          headers,
        })

        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }

        const data = await response.json()
        setAnalytics(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics')
        // Return defaults on error
        setAnalytics({
          agentId,
          userId: '',
          totalQueries: 0,
          lastUsedAt: null,
          last7dQueries: 0,
          positiveFeedbackCount: 0,
          negativeFeedbackCount: 0,
          updatedAt: new Date().toISOString(),
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [agentId, enabled])

  return { analytics, loading, error }
}

