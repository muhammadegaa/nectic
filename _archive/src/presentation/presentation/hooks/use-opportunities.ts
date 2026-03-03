/**
 * Presentation Hook: Opportunities
 * React hook for opportunity operations
 */

import { useState, useEffect } from 'react'
import { OpportunityListDTO, OpportunityDetailDTO } from '@/application/dtos/opportunity.dto'

export function useOpportunities(userId: string | null) {
  const [opportunities, setOpportunities] = useState<OpportunityListDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOpportunities = async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/opportunities/list?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch opportunities')
      }

      const data = await response.json()
      setOpportunities(data.opportunities || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const generateOpportunities = async (): Promise<boolean> => {
    if (!userId) return false

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/opportunities/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate opportunities')
      }

      // Refresh opportunities after generation
      await fetchOpportunities()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchOpportunities()
    }
  }, [userId])

  return {
    opportunities,
    loading,
    error,
    generateOpportunities,
    refetch: fetchOpportunities,
  }
}















