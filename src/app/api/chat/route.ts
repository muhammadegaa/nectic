/**
 * Chat API Route
 * POST /api/chat - Chat with an AI agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'
import { adminDb } from '@/infrastructure/firebase/firebase-server'

const agentRepo = new FirebaseAgentRepository()

/**
 * Detect intent from user message using agent's intent mappings
 */
function detectIntent(message: string, intentMappings: any[]): string[] {
  const lowerMessage = message.toLowerCase()
  const matchedCollections = new Set<string>()

  // Check each intent mapping
  for (const mapping of intentMappings) {
    const keywords = mapping.keywords.map((k: string) => k.toLowerCase())
    const hasMatch = keywords.some(keyword => lowerMessage.includes(keyword))

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
    const { agentId, message } = body

    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'agentId and message are required' },
        { status: 400 }
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
    const systemPrompt = `You are an AI assistant that helps users understand their enterprise data. 
You have access to the following data collections: ${agent.collections.join(', ')}.
Answer the user's question based on the provided data. Be concise, accurate, and helpful.
If the data doesn't contain enough information, say so.`

    const userPrompt = `User question: "${message}"

Available data:
${dataSummary || 'No data available'}

Please provide a clear, natural language answer based on this data.`

    // Call OpenAI GPT-4o
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
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${openaiResponse.statusText} - ${JSON.stringify(errorData)}`)
    }

    const completion = await openaiResponse.json()
    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'

    return NextResponse.json({
      response,
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

