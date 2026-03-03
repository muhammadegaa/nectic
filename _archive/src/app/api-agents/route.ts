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
    const { 
      name, 
      description, 
      collections, 
      intentMappings, 
      databaseConnection, 
      agenticConfig,
      modelConfig,
      memoryConfig,
      systemPrompt,
      deploymentConfig,
      workflowConfig
    } = body

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

    // Rate limiting
    const { checkRateLimit, getRateLimitIdentifier } = await import('@/lib/rate-limit')
    const rateLimitResult = await checkRateLimit(getRateLimitIdentifier(request, userId))
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      )
    }

    const agent = await agentRepo.create({
      name,
      description,
      collections,
      intentMappings: intentMappings || [],
      databaseConnection: databaseConnection || undefined,
      agenticConfig: agenticConfig || undefined,
      modelConfig: modelConfig || undefined,
      memoryConfig: memoryConfig || undefined,
      systemPrompt: systemPrompt || undefined,
      deploymentConfig: deploymentConfig || undefined,
      workflowConfig: workflowConfig || undefined,
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
