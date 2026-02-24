/**
 * Agent Audit Logs API Route
 * GET /api/agents/[id]/audit - Get audit logs for an agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'
import { listAuditLogsByAgent } from '@/infrastructure/audit-log.repository'
import { requireAuth } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

const agentRepo = new FirebaseAgentRepository()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Verify agent exists and belongs to user
    const agent = await agentRepo.findById(params.id)
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as 'data_access' | 'tool_call' | null
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 200) {
      return NextResponse.json(
        { error: 'Invalid limit. Must be between 1 and 200' },
        { status: 400 }
      )
    }

    // Validate type if provided
    if (type && type !== 'data_access' && type !== 'tool_call') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "data_access" or "tool_call"' },
        { status: 400 }
      )
    }

    // Fetch audit logs
    const logs = await listAuditLogsByAgent({
      agentId: params.id,
      userId,
      type: type || undefined,
      limit,
    })

    return NextResponse.json({ logs })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', message: error.message },
      { status: 500 }
    )
  }
}

