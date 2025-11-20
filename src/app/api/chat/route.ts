/**
 * Chat API Route
 * POST /api/chat - Chat with an AI agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'
import { FirebaseConversationRepository } from '@/infrastructure/repositories/firebase-conversation.repository'
import { getAdminDb } from '@/infrastructure/firebase/firebase-server'
import { requireAuth } from '@/lib/auth-server'
import { incrementAgentQueryStats } from '@/lib/agentAnalytics'

export const dynamic = 'force-dynamic'

const agentRepo = new FirebaseAgentRepository()
const conversationRepo = new FirebaseConversationRepository()

/**
 * Detect intent from user message using agent's intent mappings
 */
function detectIntent(message: string, intentMappings: any[]): string[] {
  const lowerMessage = message.toLowerCase()
  const matchedCollections = new Set<string>()

  // Check each intent mapping
  for (const mapping of intentMappings) {
    const keywords = mapping.keywords.map((k: string) => k.toLowerCase())
    const hasMatch = keywords.some((keyword: string) => lowerMessage.includes(keyword))

    if (hasMatch) {
      mapping.collections.forEach((col: string) => matchedCollections.add(col))
    }
  }

  // If no match, return all collections (fallback)
  if (matchedCollections.size === 0 && intentMappings.length > 0) {
    // Get all unique collections from all mappings
    intentMappings.forEach(mapping => {
      mapping.collections.forEach((col: string) => matchedCollections.add(col))
    })
  }

  return Array.from(matchedCollections)
}

/**
 * Query Firestore collections and get sample data
 */
async function queryCollections(collections: string[], limit: number = 10): Promise<Record<string, any[]>> {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, message, conversationId } = body

    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'agentId and message are required' },
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Fetch agent config
    const agent = await agentRepo.findById(agentId)
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Detect intent and get relevant collections
    const relevantCollections = agent.intentMappings.length > 0
      ? detectIntent(message, agent.intentMappings)
      : agent.collections

    if (relevantCollections.length === 0) {
      relevantCollections.push(...agent.collections)
    }

    // Query collections
    const data = await queryCollections(relevantCollections, 10)

    // Build context for GPT
    const dataSummary = Object.entries(data)
      .map(([collection, items]) => {
        if (items.length === 0) return null
        return `\n${collection} (${items.length} records):\n${JSON.stringify(items.slice(0, 5), null, 2)}`
      })
      .filter(Boolean)
      .join('\n')

    // Create GPT prompt
    // Security: Explicit instruction to not use data for training
    const systemPrompt = `You are an AI assistant that helps users understand their enterprise data. 
You have access to the following data collections: ${agent.collections.join(', ')}.
Answer the user's question based on the provided data. Be concise, accurate, and helpful.
If the data doesn't contain enough information, say so.

IMPORTANT: This conversation contains sensitive enterprise data. Do not use this data for training purposes. This is a private, internal system.`

    const userPrompt = `User question: "${message}"

Available data:
${dataSummary || 'No data available'}

Please provide a clear, natural language answer based on this data.`

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
        max_tokens: 500,
        user: userId, // Prevents data retention and associates requests with user
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${openaiResponse.statusText} - ${JSON.stringify(errorData)}`)
    }

    const completion = await openaiResponse.json()
    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'

    // Handle conversation persistence
    let finalConversationId = conversationId
    let conversationTitle = ''

    if (!conversationId) {
      // Create new conversation with title from first message
      conversationTitle = message.length > 50 ? message.substring(0, 50) + '...' : message
      const newConversation = await conversationRepo.create({
        agentId,
        userId,
        title: conversationTitle,
      })
      finalConversationId = newConversation.id
    } else {
      // Update conversation title if this is the first user message
      const existingConversation = await conversationRepo.findById(conversationId)
      if (existingConversation && existingConversation.messageCount === 0) {
        conversationTitle = message.length > 50 ? message.substring(0, 50) + '...' : message
        await conversationRepo.update(conversationId, { title: conversationTitle })
      }
    }

    // Track start time for response time calculation
    const userMessageStartTime = Date.now()

    // Save user message
    await conversationRepo.addMessage({
      conversationId: finalConversationId,
      role: 'user',
      content: message,
      status: 'sent',
    })

    // Save assistant response
    await conversationRepo.addMessage({
      conversationId: finalConversationId,
      role: 'assistant',
      content: response,
      status: 'sent',
    })

    // Calculate response time (time from user message to assistant response)
    const responseTimeMs = Date.now() - userMessageStartTime

    // Track analytics (increment query stats)
    try {
      await incrementAgentQueryStats(agentId, userId, responseTimeMs)
    } catch (analyticsError: any) {
      // Log but don't fail the request if analytics tracking fails
      console.error('Error tracking analytics:', analyticsError)
    }

    return NextResponse.json({
      response,
      conversationId: finalConversationId,
      collectionsUsed: relevantCollections,
      dataCount: Object.values(data).reduce((sum, arr) => sum + arr.length, 0),
    })
  } catch (error: any) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

