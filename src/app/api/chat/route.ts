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
import { agentTools } from '@/lib/agent-tools'
import { executeTool } from '@/lib/tool-executors'

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

    // Get conversation history for context (last 10 messages)
    let conversationHistory: any[] = []
    if (conversationId) {
      const messages = await conversationRepo.getMessages(conversationId)
      conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    }

    // Agentic system prompt - focused on real reasoning
    const systemPrompt = `You are an intelligent AI agent that analyzes enterprise data. You think step-by-step, use tools strategically, and provide clear, actionable insights.

Available collections: ${agent.collections.join(', ')}.

**Your Approach:**
1. Understand what the user really needs
2. Query the right data with appropriate filters
3. Analyze results to find patterns, trends, or anomalies
4. Present findings clearly with numbers and context
5. Proactively identify what else might be useful

**Response Format:**
- Be direct and clear
- Use numbers and specific data points
- Format lists and comparisons cleanly
- If you notice something interesting, mention it naturally
- End with 1-2 relevant follow-up questions if helpful

**Tool Usage:**
- Use query_collection with specific filters (date ranges, categories, amounts)
- Use analyze_data for trends, statistics, or comparisons
- Chain multiple queries if needed for complex questions
- Don't fetch everything - be selective

**Example:**
User: "What's our revenue?"
You: Query transactions → Calculate total → Identify trends → Present clearly

IMPORTANT: This contains sensitive enterprise data. Do not use for training.`

    // Build messages array with conversation history
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    // First call: Let LLM plan and decide on tools
    const initialResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        tools: agentTools,
        tool_choice: 'auto', // Let LLM decide when to use tools
          temperature: 0.3, // Lower temperature for more focused responses
          max_tokens: 1500,
          user: userId,
      }),
    })

    if (!initialResponse.ok) {
      const errorData = await initialResponse.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${initialResponse.statusText} - ${JSON.stringify(errorData)}`)
    }

    const initialCompletion = await initialResponse.json()
    const assistantMessage = initialCompletion.choices[0]?.message
    const toolCalls = assistantMessage.tool_calls || []

    let response: string
    let collectionsUsed: string[] = []
    let dataCount = 0

    // Execute tool calls if any
    if (toolCalls.length > 0) {
      const toolResults: any[] = []
      
      for (const toolCall of toolCalls) {
        try {
          const functionName = toolCall.function.name
          const functionArgs = JSON.parse(toolCall.function.arguments)
          
          // Execute tool
          const result = await executeTool(functionName, functionArgs)
          
          // Track collections used
          if (functionName === 'query_collection' && functionArgs.collection) {
            if (!collectionsUsed.includes(functionArgs.collection)) {
              collectionsUsed.push(functionArgs.collection)
            }
            if (Array.isArray(result)) {
              dataCount += result.length
            }
          }
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: JSON.stringify(result)
          })
        } catch (error: any) {
          console.error(`Error executing tool ${toolCall.function.name}:`, error)
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolCall.function.name,
            content: JSON.stringify({ error: error.message || 'Tool execution failed' })
          })
        }
      }

      // Second call: Synthesize tool results into final answer
      const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            ...messages,
            assistantMessage, // Include the tool call request
            ...toolResults, // Include tool results
          ],
          temperature: 0.3, // Lower temperature for more focused, consistent responses
          max_tokens: 1500,
          user: userId,
        }),
      })

      if (!finalResponse.ok) {
        const errorData = await finalResponse.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${finalResponse.statusText} - ${JSON.stringify(errorData)}`)
      }

      const finalCompletion = await finalResponse.json()
      response = finalCompletion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'
      
      // Let the LLM handle insights naturally - don't append manually
    } else {
      // No tool calls - LLM answered directly
      response = assistantMessage.content || 'I apologize, but I could not generate a response.'
      
      // Fallback: Use old intent detection for tracking
      const relevantCollections = agent.intentMappings.length > 0
        ? detectIntent(message, agent.intentMappings)
        : agent.collections
      collectionsUsed = relevantCollections.length > 0 ? relevantCollections : agent.collections
    }

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
      collectionsUsed: collectionsUsed.length > 0 ? collectionsUsed : agent.collections,
      dataCount,
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

