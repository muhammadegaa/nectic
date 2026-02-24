/**
 * Conversation API Route
 * GET /api/conversations/[id] - Get conversation and messages
 * DELETE /api/conversations/[id] - Delete conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { FirebaseConversationRepository } from '@/infrastructure/repositories/firebase-conversation.repository'
import { requireAuth } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

const conversationRepo = new FirebaseConversationRepository()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id

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

    const conversation = await conversationRepo.findById(conversationId)
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (conversation.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this conversation' },
        { status: 403 }
      )
    }

    const messages = await conversationRepo.getMessages(conversationId)

    return NextResponse.json({
      conversation,
      messages,
    })
  } catch (error: any) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id

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

    // Verify ownership before deleting
    const conversation = await conversationRepo.findById(conversationId)
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    if (conversation.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this conversation' },
        { status: 403 }
      )
    }

    await conversationRepo.delete(conversationId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation', message: error.message },
      { status: 500 }
    )
  }
}

