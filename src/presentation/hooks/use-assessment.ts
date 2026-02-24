/**
 * Presentation Hook: Assessment
 * React hook for assessment operations
 */

import { useState } from 'react'
import { AssessmentResultDTO, SubmitAssessmentDTO } from '@/application/dtos/assessment.dto'

export function useAssessment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitAssessment = async (dto: SubmitAssessmentDTO): Promise<AssessmentResultDTO | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit assessment')
      }

      const result = await response.json()
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    submitAssessment,
    loading,
    error,
  }
}















