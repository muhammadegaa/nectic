/**
 * Conversation API Route
 * GET /api/conversations/[id] - Get conversation and messages
 * DELETE /api/conversations/[id] - Delete conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { FirebaseConversationRepository } from '@/infrastructure/repositories/firebase-conversation.repository'

export const dynamic = 'force-dynamic'

const conversationRepo = new FirebaseConversationRepository()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const conversation = await conversationRepo.findById(conversationId)
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
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

