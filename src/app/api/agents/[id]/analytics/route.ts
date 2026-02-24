/**
 * Agent Analytics API Route
 * GET /api/agents/[id]/analytics - Get analytics for an agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { getAgentAnalytics } from '@/lib/agentAnalytics'
import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'

export const dynamic = 'force-dynamic'

const agentRepo = new FirebaseAgentRepository()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id

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

    // Get analytics
    const analytics = await getAgentAnalytics(agentId, userId)

    // Return analytics or defaults if not found
    if (!analytics) {
      return NextResponse.json({
        agentId,
        userId,
        totalQueries: 0,
        lastUsedAt: null,
        last7dQueries: 0,
        positiveFeedbackCount: 0,
        negativeFeedbackCount: 0,
        updatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json(analytics)
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', message: error.message },
      { status: 500 }
    )
  }
}

