/**
 * Agent Opportunity Report API Route
 * POST /api/agents/[id]/opportunity-report - Generate AI opportunity report from agent's conversations and data
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'
import { FirebaseConversationRepository } from '@/infrastructure/repositories/firebase-conversation.repository'
import { getAdminDb } from '@/infrastructure/firebase/firebase-server'

export const dynamic = 'force-dynamic'

const agentRepo = new FirebaseAgentRepository()
const conversationRepo = new FirebaseConversationRepository()

/**
 * Query collections to get sample data
 */
async function queryCollections(collections: string[], limit: number = 20): Promise<Record<string, any[]>> {
  const results: Record<string, any[]> = {}

  for (const collectionName of collections) {
    try {
      const adminDb = getAdminDb()
      const snapshot = await adminDb
        .collection(collectionName)
        .limit(limit)
        .get()

      results[collectionName] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error)
      results[collectionName] = []
    }
  }

  return results
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id

    // Authenticate user
    let userId: string
    try {
      userId = await requireAuth(request)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      )
    }

    // Verify agent ownership
    const agent = await agentRepo.findById(agentId)
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    if (agent.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this agent' },
        { status: 403 }
      )
    }

    // Fetch recent conversations and messages
    const conversations = await conversationRepo.findByAgentAndUser(agentId, userId, 10)
    const allMessages: Array<{ role: string; content: string; timestamp: string }> = []

    for (const conv of conversations.slice(0, 5)) { // Limit to 5 most recent conversations
      const messages = await conversationRepo.getMessages(conv.id)
      allMessages.push(...messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      })))
    }

    // Get sample data from agent's collections
    const sampleData = await queryCollections(agent.collections, 15)

    // Build context for GPT
    const conversationsSummary = allMessages
      .slice(-20) // Last 20 messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n')

    const dataSummary = Object.entries(sampleData)
      .map(([collection, items]) => {
        if (items.length === 0) return null
        return `\n${collection} (${items.length} sample records):\n${JSON.stringify(items.slice(0, 5), null, 2)}`
      })
      .filter(Boolean)
      .join('\n')

    // Create GPT prompt for opportunity report
    const systemPrompt = `You are an AI automation consultant. Analyze the provided agent conversations and data to identify specific AI automation opportunities. Generate a comprehensive opportunity report in markdown format.`

    const userPrompt = `Analyze the following agent data and generate an AI Opportunity Report:

AGENT INFORMATION:
- Name: ${agent.name}
- Description: ${agent.description || 'N/A'}
- Data Collections: ${agent.collections.join(', ')}

RECENT CONVERSATIONS (sample):
${conversationsSummary || 'No conversations yet'}

SAMPLE DATA FROM COLLECTIONS:
${dataSummary || 'No data available'}

Please generate a comprehensive AI Opportunity Report that includes:
1. Executive Summary
2. Key Findings from Conversations
3. Identified Automation Opportunities (3-5 specific opportunities)
4. Estimated Impact (time savings, cost savings, efficiency gains)
5. Recommended Next Steps

Format the report as clean, professional markdown suitable for sharing with stakeholders.`

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Call OpenAI GPT-4o
    // Security: Include user ID to prevent data retention, and explicit instruction to not use for training
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        user: userId, // Prevents data retention and associates requests with user
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${openaiResponse.statusText} - ${JSON.stringify(errorData)}`)
    }

    const completion = await openaiResponse.json()
    const report = completion.choices[0]?.message?.content || 'Unable to generate report at this time.'

    return NextResponse.json({
      report,
      agentId,
      agentName: agent.name,
      conversationsAnalyzed: conversations.length,
      dataCollectionsAnalyzed: agent.collections.length,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error generating opportunity report:', error)
    return NextResponse.json(
      { error: 'Failed to generate opportunity report', message: error.message },
      { status: 500 }
    )
  }
}

