/**
 * Slack Integration Webhook
 * POST /api/integrations/slack - Handle Slack events
 */

import { NextRequest, NextResponse } from 'next/server'
import { processSlackEvent, verifySlackSignature } from '@/infrastructure/integrations/slack'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const event = JSON.parse(body)

    // Verify Slack signature
    const signature = request.headers.get('x-slack-signature') || ''
    const timestamp = request.headers.get('x-slack-request-timestamp') || ''
    const signingSecret = process.env.SLACK_SIGNING_SECRET || ''

    if (signingSecret && !verifySlackSignature(signature, timestamp, body, signingSecret)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // URL verification challenge
    if (event.type === 'url_verification') {
      return NextResponse.json({ challenge: event.challenge })
    }

    // Get agent ID from event (stored in app configuration)
    const agentId = event.agent_id || process.env.DEFAULT_SLACK_AGENT_ID

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID not configured' },
        { status: 400 }
      )
    }

    // Process Slack event
    const response = await processSlackEvent(event, agentId)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Slack webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

