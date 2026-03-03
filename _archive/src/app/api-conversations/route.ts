/**
 * Conversations API Route
 * GET /api/conversations - List conversations for an agent
 * POST /api/conversations - Create a new conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { FirebaseConversationRepository } from '@/infrastructure/repositories/firebase-conversation.repository'
import { requireAuth } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

const conversationRepo = new FirebaseConversationRepository()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
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

    const conversations = await conversationRepo.findByAgentAndUser(agentId, userId)
    return NextResponse.json(conversations)
  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, title } = body

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
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

    const conversation = await conversationRepo.create({
      agentId,
      userId,
      title: title || 'New Conversation',
    })

    return NextResponse.json(conversation)
  } catch (error: any) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation', message: error.message },
      { status: 500 }
    )
  }
}

