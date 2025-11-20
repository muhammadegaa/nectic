/**
 * Agent Analytics Entity
 * Tracks usage metrics and feedback for AI agents
 */

export interface AgentAnalytics {
  agentId: string
  userId: string // owner
  totalQueries: number
  lastUsedAt: string | null // ISO timestamp
  last7dQueries?: number // Optional, approximate count
  positiveFeedbackCount: number
  negativeFeedbackCount: number
  updatedAt: string // ISO timestamp
}

