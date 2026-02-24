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
import { powerfulTools } from '@/lib/powerful-tools'
import { executeTool } from '@/lib/tool-executors'
import { buildSystemPrompt, filterTools } from '@/lib/agentic-prompt-builder'
import { smartEngage } from '@/lib/cost-optimizer'
import { callLLM } from '@/lib/llm-client'
import { executeWorkflow } from '@/lib/workflow-executor'
import { AccessDeniedError, ValidationError } from '@/domain/errors/access-errors'

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
  let body: any = null
  let userId: string | undefined = undefined
  try {
    body = await request.json()
    const { agentId, message, conversationId } = body

    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'agentId and message are required' },
        { status: 400 }
      )
    }

    // Authenticate user via server-side auth
    try {
      userId = await requireAuth(request)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      )
    }

    // Rate limiting
    const { checkRateLimit, getRateLimitIdentifier } = await import('@/lib/rate-limit')
    const rateLimitResult = await checkRateLimit(getRateLimitIdentifier(request, userId))
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
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

    // Get conversation history for context based on memory configuration
    let conversationHistory: any[] = []
    const memoryType = agent.memoryConfig?.type || 'session'
    const contextWindow = agent.memoryConfig?.maxTurns || 
                         agent.agenticConfig?.contextMemory?.contextWindow || 
                         10
    
    // Only load conversation history if memory is enabled
    const memoryEnabled = agent.memoryConfig !== undefined || 
                         agent.agenticConfig?.contextMemory?.enabled !== false
    
    if (memoryEnabled && conversationId) {
      const messages = await conversationRepo.getMessages(conversationId)
      
      // Apply memory type logic
      if (memoryType === 'session') {
        // Session: Only current conversation
        conversationHistory = messages.slice(-contextWindow).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      } else if (memoryType === 'persistent') {
        // Persistent: All conversations with this user for this agent
        // For MVP, we'll use current conversation but could extend to cross-conversation
        conversationHistory = messages.slice(-contextWindow).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      } else {
        // Episodic: Key events only (for MVP, same as session)
        conversationHistory = messages.slice(-contextWindow).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      }
    }

    // Cost Optimization: Pre-screen message with Smart Engage
    const costOptimizationEnabled = agent.agenticConfig?.costOptimization?.enabled !== false
    if (costOptimizationEnabled) {
      const smartEngageResult = await smartEngage(
        message,
        agent.collections,
        conversationHistory,
        true
      )

      if (!smartEngageResult.useFullLLM && smartEngageResult.response) {
        // Return cached/template response without calling expensive LLM
        return NextResponse.json({
          response: smartEngageResult.response,
          reasoningSteps: [{
            step: smartEngageResult.reason,
            tool: 'smart_engage',
            result: 'Message pre-screened, using optimized response'
          }],
          collectionsUsed: [],
          dataCount: 0,
          costOptimized: true
        })
      }
    }

    // Handle conversation persistence (needed for workflow too)
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

    // Check if workflow is configured - if so, execute workflow instead of LLM
    if (agent.workflowConfig && agent.workflowConfig.nodes && agent.workflowConfig.nodes.length > 0) {
      try {
        const workflowResult = await executeWorkflow(
          agent.workflowConfig.nodes,
          agent.workflowConfig.edges || [],
          {
            variables: { message, userId },
            results: {},
            userId,
            agentId,
            databaseConnection: agent.databaseConnection,
          }
        )

        if (workflowResult.success) {
          // Save messages
          await conversationRepo.addMessage({
            conversationId: finalConversationId,
            role: 'user',
            content: message,
            status: 'sent',
          })

          await conversationRepo.addMessage({
            conversationId: finalConversationId,
            role: 'assistant',
            content: JSON.stringify(workflowResult.output) || 'Workflow executed successfully',
            status: 'sent',
          })

          return NextResponse.json({
            response: JSON.stringify(workflowResult.output) || 'Workflow executed successfully',
            conversationId: finalConversationId,
            collectionsUsed: agent.collections,
            dataCount: 0,
            reasoningSteps: workflowResult.steps.map(step => ({
              step: `Executed ${step.nodeType} node: ${step.nodeId}`,
              tool: step.nodeType,
              result: step.result,
            })),
          })
        } else {
          throw new Error(workflowResult.error || 'Workflow execution failed')
        }
      } catch (error: any) {
        console.error('Workflow execution error:', error)
        // Fall through to LLM-based execution
      }
    }

    // Build system prompt - use custom systemPrompt if provided, otherwise build from config
    const systemPrompt = agent.systemPrompt || buildSystemPrompt(agent.collections, agent.agenticConfig)
    
    // Filter tools based on agentic configuration
    const availableTools = filterTools(agent.agenticConfig)

    // Get model configuration (default to OpenAI gpt-4o if not configured)
    const modelProvider = agent.modelConfig?.provider || 'openai'
    const model = agent.modelConfig?.model || 'gpt-4o'
    const temperature = agent.modelConfig?.temperature ?? 0.3
    const maxTokens = agent.modelConfig?.maxTokens || 1500

    // Build messages array with conversation history
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    // First call: Let LLM plan and decide on tools
    let assistantMessage: any
    let toolCalls: any[] = []

    try {
      const llmResponse = await callLLM(
        modelProvider,
        model,
        {
          messages,
          tools: availableTools.length > 0 ? availableTools : [...agentTools, ...powerfulTools],
          tool_choice: 'auto',
          temperature,
          max_tokens: maxTokens,
          user: userId,
        },
        agent.modelConfig?.apiKey
      )

      assistantMessage = {
        role: 'assistant',
        content: llmResponse.content,
        tool_calls: llmResponse.tool_calls,
      }
      toolCalls = llmResponse.tool_calls || []
    } catch (error: any) {
      throw new Error(`LLM API error: ${error.message}`)
    }

    let response: string
    let collectionsUsed: string[] = []
    let dataCount = 0
    let reasoningSteps: Array<{ step: string; tool?: string; args?: any; result?: any }> = []

    // Execute tool calls if any
    if (toolCalls.length > 0) {
      // Add initial reasoning step
      reasoningSteps.push({
        step: `Analyzing your question: "${message}"`,
      })
      
      reasoningSteps.push({
        step: `Planning: I need to query ${toolCalls.length} data source${toolCalls.length > 1 ? 's' : ''} to answer this.`,
      })

      const toolResults: any[] = []
      
      for (const toolCall of toolCalls) {
        try {
          const functionName = toolCall.function.name
          const functionArgs = JSON.parse(toolCall.function.arguments)
          
          // Add reasoning step for tool call
          if (functionName === 'query_collection') {
            const filters = functionArgs.filters || {}
            let filterDesc = []
            if (filters.dateRange) filterDesc.push(`date range: ${filters.dateRange.start} to ${filters.dateRange.end}`)
            if (filters.category) filterDesc.push(`category: ${filters.category}`)
            if (filters.status) filterDesc.push(`status: ${filters.status}`)
            if (filters.minAmount) filterDesc.push(`min amount: $${filters.minAmount}`)
            
            reasoningSteps.push({
              step: `Querying ${functionArgs.collection}${filterDesc.length > 0 ? ` with filters: ${filterDesc.join(', ')}` : ''}`,
              tool: functionName,
              args: functionArgs
            })
          } else if (functionName === 'analyze_data') {
            reasoningSteps.push({
              step: `Analyzing data for ${functionArgs.analysisType}${functionArgs.groupBy ? ` grouped by ${functionArgs.groupBy}` : ''}`,
              tool: functionName,
              args: functionArgs
            })
          }
          
          // Execute tool (pass agent's database connection and userId if available)
          let result
          try {
            result = await executeTool(functionName, functionArgs, agent.databaseConnection, userId, agentId)
            
            // Check for errors in result
            if (result && result.error) {
              console.error(`Tool ${functionName} returned error:`, result.error)
              // Continue with error in result - let LLM handle it
            }
          } catch (error: any) {
            console.error(`Tool execution error for ${functionName}:`, error)
            result = {
              error: error.message || 'Tool execution failed',
              tool: functionName,
              args: functionArgs
            }
          }
          
          // Track collections used
          if (functionName === 'query_collection' && functionArgs.collection) {
            if (!collectionsUsed.includes(functionArgs.collection)) {
              collectionsUsed.push(functionArgs.collection)
            }
            if (Array.isArray(result)) {
              dataCount += result.length
              // Update reasoning step with result
              const lastStep = reasoningSteps[reasoningSteps.length - 1]
              if (lastStep) {
                lastStep.result = { count: result.length, sample: result.slice(0, 2) }
              }
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
          reasoningSteps.push({
            step: `Error executing ${toolCall.function.name}: ${error.message}`,
            tool: toolCall.function.name
          })
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolCall.function.name,
            content: JSON.stringify({ error: error.message || 'Tool execution failed' })
          })
        }
      }
      
      // Add synthesis step
      reasoningSteps.push({
        step: `Synthesizing ${dataCount} record${dataCount !== 1 ? 's' : ''} into answer...`,
      })

      // Second call: Synthesize tool results into final answer
      const finalLLMResponse = await callLLM(
        modelProvider,
        model,
        {
          messages: [
            ...messages,
            assistantMessage, // Include the tool call request
            ...toolResults, // Include tool results
          ],
          temperature,
          max_tokens: maxTokens,
          user: userId,
        },
        agent.modelConfig?.apiKey
      )

      response = finalLLMResponse.content || 'I apologize, but I could not generate a response.'
      
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

    // Only include reasoning steps if configured to show them
    const showReasoning = agent.agenticConfig?.reasoning?.showReasoning !== false
    
    return NextResponse.json({
      response,
      conversationId: finalConversationId,
      collectionsUsed: collectionsUsed.length > 0 ? collectionsUsed : agent.collections,
      dataCount,
      reasoningSteps: showReasoning && reasoningSteps.length > 0 ? reasoningSteps : undefined, // Include reasoning steps only if enabled
    })
  } catch (error: any) {
    // Log detailed error for debugging (server-side only)
    console.error('Chat API Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      agentId: body?.agentId,
      userId,
    })

    // Handle access control errors with proper status codes
    const isAccessDenied = error instanceof AccessDeniedError ||
      (error instanceof Error && (
        error.message?.includes('not allowed') ||
        error.message?.includes('Unauthorized') ||
        error.message?.includes('does not belong')
      ))

    const isValidationError = error instanceof ValidationError

    let status = 500
    let safeMessage = 'An error occurred while processing your request. Please try again.'

    if (isAccessDenied) {
      status = 403
      safeMessage = error.message || 'Access denied'
    } else if (isValidationError) {
      status = 400
      safeMessage = error.message || 'Invalid request'
    } else if (error.message?.includes('LLM API error') || error.message?.includes('OpenAI API error')) {
      // LLM-specific errors
      safeMessage = 'AI service temporarily unavailable. Please try again.'
      console.error('LLM API Error:', error.message)
    } else if (error.message?.includes('OpenAI API key')) {
      status = 500
      safeMessage = 'AI service configuration error. Please contact support.'
    }

    return NextResponse.json(
      {
        error: safeMessage,
        message: safeMessage,
      },
      { status }
    )
  }
}

