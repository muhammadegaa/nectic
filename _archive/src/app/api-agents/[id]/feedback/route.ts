/**
 * Agent Feedback API Route
 * POST /api/agents/[id]/feedback - Submit feedback (thumbs up/down) for an agent response
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { addAgentFeedback } from '@/lib/agentAnalytics'
import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'
import { FirebaseConversationRepository } from '@/infrastructure/repositories/firebase-conversation.repository'

export const dynamic = 'force-dynamic'

const agentRepo = new FirebaseAgentRepository()
const conversationRepo = new FirebaseConversationRepository()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const body = await request.json()
    const { conversationId, messageId, feedback } = body

    // Validate input
    if (!feedback || (feedback !== 'up' && feedback !== 'down')) {
      return NextResponse.json(
        { error: 'Invalid feedback. Must be "up" or "down"' },
        { status: 400 }
      )
    }

    // Authenticate user
    let userId: string
    try {
      userId = await requireAuth(request)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      )
    }

    // Verify agent ownership
    const agent = await agentRepo.findById(agentId)
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    if (agent.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this agent' },
        { status: 403 }
      )
    }

    // Optional: Verify message exists and belongs to the conversation/agent
    if (conversationId && messageId) {
      try {
        const conversation = await conversationRepo.findById(conversationId)
        if (!conversation || conversation.agentId !== agentId || conversation.userId !== userId) {
          return NextResponse.json(
            { error: 'Invalid conversation or message' },
            { status: 404 }
          )
        }
      } catch (e) {
        // If message validation fails, we still allow feedback (graceful degradation)
        console.warn('Could not validate message:', e)
      }
    }

    // Add feedback
    await addAgentFeedback(agentId, userId, feedback)

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded',
    })
  } catch (error: any) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback', message: error.message },
      { status: 500 }
    )
  }
}

