/**
 * Slack Integration
 * Handles Slack bot interactions and message processing
 */

import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'

const agentRepo = new FirebaseAgentRepository()

export interface SlackEvent {
  type: string
  event?: {
    type: string
    text: string
    user: string
    channel: string
    ts: string
  }
  challenge?: string
}

/**
 * Process Slack event (message, app_mention, etc.)
 */
export async function processSlackEvent(
  event: SlackEvent,
  agentId: string
): Promise<{ text: string; thread_ts?: string }> {
  if (event.type === 'url_verification' && event.challenge) {
    return { text: event.challenge }
  }

  if (!event.event || event.event.type !== 'app_mention' && event.event.type !== 'message') {
    return { text: 'Event type not supported' }
  }

  const message = event.event.text
  const userId = event.event.user
  const channel = event.event.channel
  const threadTs = event.event.ts

  // Get agent
  const agent = await agentRepo.findById(agentId)
  if (!agent) {
    return { text: 'Agent not found' }
  }

  // Process message through chat API
  try {
    // Call internal chat API
    const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use service account or system user for Slack requests
        'x-slack-user-id': userId,
      },
      body: JSON.stringify({
        agentId,
        message: message.replace(/<@[^>]+>/g, '').trim(), // Remove Slack user mentions
        conversationId: `slack-${channel}-${userId}`, // Persistent conversation per channel+user
        source: 'slack',
        metadata: {
          slackChannel: channel,
          slackUser: userId,
          slackThread: threadTs,
        },
      }),
    })

    if (!chatResponse.ok) {
      const error = await chatResponse.json().catch(() => ({}))
      throw new Error(error.error || 'Chat API error')
    }

    const data = await chatResponse.json()
    return {
      text: data.response || 'I apologize, but I could not generate a response.',
      thread_ts: threadTs,
    }
  } catch (error: any) {
    console.error('Slack chat processing error:', error)
    return {
      text: 'I encountered an error processing your request. Please try again.',
      thread_ts: threadTs,
    }
  }
}

/**
 * Send message to Slack channel
 */
export async function sendSlackMessage(
  channel: string,
  message: string,
  token: string,
  threadTs?: string
): Promise<boolean> {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        text: message,
        thread_ts: threadTs,
      }),
    })

    const data = await response.json()
    return data.ok === true
  } catch (error) {
    console.error('Slack API error:', error)
    return false
  }
}

/**
 * Verify Slack request signature
 */
export function verifySlackSignature(
  signature: string,
  timestamp: string,
  body: string,
  signingSecret: string
): boolean {
  const crypto = require('crypto')
  
  // Check timestamp (prevent replay attacks)
  const currentTime = Math.floor(Date.now() / 1000)
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) { // 5 minutes
    return false
  }

  // Verify signature
  const [version, hash] = signature.split('=')
  if (version !== 'v0') {
    return false
  }

  const sigBaseString = `v0:${timestamp}:${body}`
  const hmac = crypto.createHmac('sha256', signingSecret)
  hmac.update(sigBaseString)
  const computedHash = hmac.digest('hex')

  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(computedHash)
  )
}

