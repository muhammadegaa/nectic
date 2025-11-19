/**
 * Get Agent by ID
 * GET /api/agents/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'

export const dynamic = 'force-dynamic'

const agentRepo = new FirebaseAgentRepository()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await agentRepo.findById(params.id)
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(agent)
  } catch (error: any) {
    console.error('Error fetching agent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent', message: error.message },
      { status: 500 }
    )
  }
}




