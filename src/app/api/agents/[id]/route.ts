/**
 * Agent API Route by ID
 * GET /api/agents/[id] - Get agent by ID
 * PUT /api/agents/[id] - Update agent
 * DELETE /api/agents/[id] - Delete agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'
import { requireAuth } from '@/lib/auth-server'

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user via server-side auth
    let userId: string
    try {
      userId = await requireAuth(request)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, collections, intentMappings } = body

    // Verify agent exists and belongs to user
    const existingAgent = await agentRepo.findById(params.id)
    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    if (existingAgent.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this agent' },
        { status: 403 }
      )
    }

    if (!name || !collections || !Array.isArray(collections) || collections.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one collection are required' },
        { status: 400 }
      )
    }

    const updatedAgent = await agentRepo.update(params.id, {
      name,
      description,
      collections,
      intentMappings: intentMappings || [],
    })

    return NextResponse.json(updatedAgent)
  } catch (error: any) {
    console.error('Error updating agent:', error)
    return NextResponse.json(
      { error: 'Failed to update agent', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user via server-side auth
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
    const existingAgent = await agentRepo.findById(params.id)
    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    if (existingAgent.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this agent' },
        { status: 403 }
      )
    }

    await agentRepo.delete(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent', message: error.message },
      { status: 500 }
    )
  }
}
