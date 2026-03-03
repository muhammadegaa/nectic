/**
 * Conversation Export API Route
 * GET /api/conversations/[id]/export - Export conversation as JSON or Markdown
 */

import { NextRequest, NextResponse } from 'next/server'
import { FirebaseConversationRepository } from '@/infrastructure/repositories/firebase-conversation.repository'
import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'
import { requireAuth } from '@/lib/auth-server'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

const conversationRepo = new FirebaseConversationRepository()
const agentRepo = new FirebaseAgentRepository()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    // Validate format
    if (format !== 'json' && format !== 'markdown') {
      return NextResponse.json(
        { error: 'Invalid format. Use "json" or "markdown"' },
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

    // Fetch conversation
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

    // Fetch messages
    const messages = await conversationRepo.getMessages(conversationId)

    // Fetch agent name for markdown export
    let agentName = conversation.agentId
    if (format === 'markdown') {
      try {
        const agent = await agentRepo.findById(conversation.agentId)
        if (agent) {
          agentName = agent.name
        }
      } catch (e) {
        // If agent not found, use agentId
        console.warn('Agent not found for export:', conversation.agentId)
      }
    }

    // Format response based on format type
    if (format === 'json') {
      return NextResponse.json({
        conversationId: conversation.id,
        agentId: conversation.agentId,
        agentName: agentName,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messageCount,
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      })
    } else {
      // Markdown format
      const markdown = generateMarkdown(conversation, messages, agentName)
      
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="conversation-${conversationId}.md"`,
        },
      })
    }
  } catch (error: any) {
    console.error('Error exporting conversation:', error)
    return NextResponse.json(
      { error: 'Failed to export conversation', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Generate Markdown from conversation and messages
 */
function generateMarkdown(
  conversation: any,
  messages: any[],
  agentName: string
): string {
  const createdAt = format(new Date(conversation.createdAt), 'yyyy-MM-dd HH:mm:ss')
  const updatedAt = format(new Date(conversation.updatedAt), 'yyyy-MM-dd HH:mm:ss')

  let markdown = `# Conversation Export\n\n`
  markdown += `- **Agent:** ${agentName}\n`
  markdown += `- **Conversation ID:** ${conversation.id}\n`
  markdown += `- **Title:** ${conversation.title}\n`
  markdown += `- **Created At:** ${createdAt}\n`
  markdown += `- **Updated At:** ${updatedAt}\n`
  markdown += `- **Message Count:** ${conversation.messageCount}\n\n`
  markdown += `---\n\n`
  markdown += `## Messages\n\n`

  for (const message of messages) {
    const timestamp = format(new Date(message.timestamp), 'yyyy-MM-dd HH:mm:ss')
    const role = message.role === 'user' ? 'User' : 'Assistant'
    markdown += `**[${timestamp}] ${role}:**\n\n`
    markdown += `${message.content}\n\n`
    markdown += `---\n\n`
  }

  return markdown
}

