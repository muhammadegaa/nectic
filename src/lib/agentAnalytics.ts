/**
 * Agent Analytics Helper Functions
 * Manages agent usage metrics and feedback tracking
 */

import { getAdminDb } from '@/infrastructure/firebase/firebase-server'
import { FieldValue } from 'firebase-admin/firestore'
import type { AgentAnalytics } from '@/domain/entities/agent-analytics.entity'
import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'

const agentRepo = new FirebaseAgentRepository()
const analyticsCollection = 'agent_analytics'

/**
 * Get or create analytics document for an agent
 */
async function getOrCreateAnalyticsDoc(agentId: string, userId: string): Promise<FirebaseFirestore.DocumentReference> {
  const adminDb = getAdminDb()
  const docRef = adminDb.collection(analyticsCollection).doc(agentId)
  const doc = await docRef.get()

  if (!doc.exists) {
    // Create with defaults
    const now = new Date().toISOString()
    await docRef.set({
      agentId,
      userId,
      totalQueries: 0,
      lastUsedAt: null,
      last7dQueries: 0,
      positiveFeedbackCount: 0,
      negativeFeedbackCount: 0,
      updatedAt: now,
    })
  } else {
    // Verify ownership
    const data = doc.data()
    if (data?.userId !== userId) {
      throw new Error('Unauthorized: You do not have access to this agent\'s analytics')
    }
  }

  return docRef
}

/**
 * Increment agent query statistics
 * Called when a user sends a message to an agent
 */
export async function incrementAgentQueryStats(
  agentId: string,
  userId: string,
  responseTimeMs?: number
): Promise<void> {
  try {
    // Verify agent ownership
    const agent = await agentRepo.findById(agentId)
    if (!agent) {
      throw new Error('Agent not found')
    }
    if (agent.userId !== userId) {
      throw new Error('Unauthorized: You do not have access to this agent')
    }

    const docRef = await getOrCreateAnalyticsDoc(agentId, userId)
    const now = new Date().toISOString()

    // Get current analytics to check lastUsedAt for last7dQueries calculation
    const currentDoc = await docRef.get()
    const currentData = currentDoc.data() as AgentAnalytics | undefined
    const lastUsedAt = currentData?.lastUsedAt
      ? new Date(currentData.lastUsedAt)
      : null

    // Calculate if we should reset last7dQueries (if lastUsedAt is more than 7 days ago)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const updates: Record<string, any> = {
      totalQueries: FieldValue.increment(1),
      lastUsedAt: now,
      updatedAt: now,
    }

    // Handle last7dQueries: reset if lastUsedAt is more than 7 days ago, otherwise increment
    if (!lastUsedAt || lastUsedAt < sevenDaysAgo) {
      updates.last7dQueries = 1 // Reset to 1 (this is the first query in the new 7-day window)
    } else {
      updates.last7dQueries = FieldValue.increment(1)
    }

    await docRef.update(updates)
  } catch (error: any) {
    console.error('Error incrementing agent query stats:', error)
    throw error
  }
}

/**
 * Add feedback (thumbs up/down) to an agent
 */
export async function addAgentFeedback(
  agentId: string,
  userId: string,
  feedback: 'up' | 'down'
): Promise<void> {
  try {
    // Verify agent ownership
    const agent = await agentRepo.findById(agentId)
    if (!agent) {
      throw new Error('Agent not found')
    }
    if (agent.userId !== userId) {
      throw new Error('Unauthorized: You do not have access to this agent')
    }

    const docRef = await getOrCreateAnalyticsDoc(agentId, userId)
    const now = new Date().toISOString()

    const updates: Record<string, any> = {
      updatedAt: now,
    }

    if (feedback === 'up') {
      updates.positiveFeedbackCount = FieldValue.increment(1)
    } else {
      updates.negativeFeedbackCount = FieldValue.increment(1)
    }

    await docRef.update(updates)
  } catch (error: any) {
    console.error('Error adding agent feedback:', error)
    throw error
  }
}

/**
 * Get analytics for an agent
 * Returns null if analytics don't exist (agent never used)
 */
export async function getAgentAnalytics(
  agentId: string,
  userId: string
): Promise<AgentAnalytics | null> {
  try {
    // Verify agent ownership
    const agent = await agentRepo.findById(agentId)
    if (!agent) {
      return null
    }
    if (agent.userId !== userId) {
      throw new Error('Unauthorized: You do not have access to this agent\'s analytics')
    }

    const adminDb = getAdminDb()
    const docRef = adminDb.collection(analyticsCollection).doc(agentId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    const data = doc.data()
    if (data?.userId !== userId) {
      throw new Error('Unauthorized: You do not have access to this agent\'s analytics')
    }

    return {
      agentId: doc.id,
      ...data,
    } as AgentAnalytics
  } catch (error: any) {
    console.error('Error getting agent analytics:', error)
    throw error
  }
}

