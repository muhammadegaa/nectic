/**
 * Agent Webhook API
 * POST /api/agents/[id]/webhook - Webhook endpoint for external integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'
import { requireAuth } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

const agentRepo = new FirebaseAgentRepository()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const body = await request.json()

    // Verify webhook secret if configured
    const webhookSecret = request.headers.get('x-webhook-secret')
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      )
    }

    // Get agent
    const agent = await agentRepo.findById(agentId)
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Extract message from webhook payload
    const message = body.message || body.text || body.content || JSON.stringify(body)
    const userId = body.userId || body.user_id || 'webhook-user'
    const conversationId = body.conversationId || body.conversation_id || `webhook-${Date.now()}`

    // Forward to chat API
    const chatResponse = await fetch(`${request.nextUrl.origin}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        agentId,
        message,
        conversationId,
        source: 'webhook',
        metadata: body.metadata || {}
      }),
    })

    if (!chatResponse.ok) {
      const error = await chatResponse.json()
      return NextResponse.json(
        { error: error.error || 'Failed to process webhook' },
        { status: chatResponse.status }
      )
    }

    const data = await chatResponse.json()

    return NextResponse.json({
      success: true,
      response: data.response,
      conversationId,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

