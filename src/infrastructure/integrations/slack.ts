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
  // In production, this would call the chat API internally
  const response = `I received your message: "${message}". This is a placeholder response. Full Slack integration coming soon!`

  return {
    text: response,
    thread_ts: threadTs
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
  // Implementation of Slack signature verification
  // This is a simplified version - in production, use crypto.timingSafeEqual
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', signingSecret)
  const [version, hash] = signature.split('=')
  const sigBaseString = `${version}:${timestamp}:${body}`
  hmac.update(sigBaseString)
  const computedHash = hmac.digest('hex')
  return computedHash === hash
}

