/**
 * Agents API Route
 * POST /api/agents - Create a new agent
 * GET /api/agents - List all agents
 */

import { NextRequest, NextResponse } from 'next/server'
import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'
import { requireAuth } from '@/lib/auth-server'
import type { Agent, IntentMapping } from '@/domain/entities/agent.entity'

export const dynamic = 'force-dynamic'

const agentRepo = new FirebaseAgentRepository()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, collections, intentMappings } = body

    if (!name || !collections || !Array.isArray(collections) || collections.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one collection are required' },
        { status: 400 }
      )
    }

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

    const agent = await agentRepo.create({
      name,
      description,
      collections,
      intentMappings: intentMappings || [],
      userId,
    })

    return NextResponse.json(agent)
  } catch (error: any) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { error: 'Failed to create agent', message: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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
    
    const agents = await agentRepo.findAll(userId)
    return NextResponse.json(agents)
  } catch (error: any) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents', message: error.message },
      { status: 500 }
    )
  }
}




