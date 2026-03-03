/**
 * Agent Preview API
 * POST /api/agents/preview - Preview agent behavior without creating it
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { agentTools } from '@/lib/agent-tools'
import { powerfulTools } from '@/lib/powerful-tools'
import { executeTool } from '@/lib/tool-executors'
import { buildSystemPrompt, filterTools } from '@/lib/agentic-prompt-builder'
import { smartEngage } from '@/lib/cost-optimizer'
import { callLLM } from '@/lib/llm-client'
import type { AgenticConfig } from '@/domain/entities/agent.entity'
import type { DatabaseConnection } from '@/lib/db-adapters/base-adapter'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      message,
      collections,
      selectedTools,
      agenticConfig,
      databaseConnection,
      modelConfig,
      memoryConfig,
      systemPrompt: customSystemPrompt,
    } = body

    if (!message || !collections || !Array.isArray(collections)) {
      return NextResponse.json(
        { error: 'Message and collections are required' },
        { status: 400 }
      )
    }

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

    // Build system prompt
    const systemPrompt = customSystemPrompt || buildSystemPrompt(collections, agenticConfig)
    
    // Filter tools based on agentic configuration
    const availableTools = filterTools(agenticConfig)

    // Get model configuration (default to OpenAI gpt-4o if not configured)
    const modelProvider = modelConfig?.provider || 'openai'
    const model = modelConfig?.model || 'gpt-4o'
    const temperature = modelConfig?.temperature ?? 0.3
    const maxTokens = modelConfig?.maxTokens || 1500

    // Build messages array
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]

    // First call: Let LLM plan and decide on tools
    let assistantMessage: any
    let toolCalls: any[] = []
    let reasoningSteps: Array<{ step: string; tool?: string; args?: any; result?: any }> = []

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
        modelConfig?.apiKey
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

    // Execute tool calls if any
    if (toolCalls.length > 0) {
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
          
          // Execute tool (pass database connection if available)
          let result
          try {
            result = await executeTool(functionName, functionArgs, databaseConnection)
            
            if (result && result.error) {
              console.error(`Tool ${functionName} returned error:`, result.error)
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
            assistantMessage,
            ...toolResults,
          ],
          temperature,
          max_tokens: maxTokens,
          user: userId,
        },
        modelConfig?.apiKey
      )

      response = finalLLMResponse.content || 'I apologize, but I could not generate a response.'
    } else {
      // No tool calls - LLM answered directly
      response = assistantMessage.content || 'I apologize, but I could not generate a response.'
      collectionsUsed = collections
    }

    // Only include reasoning steps if configured to show them
    const showReasoning = agenticConfig?.reasoning?.showReasoning !== false

    return NextResponse.json({
      response,
      collectionsUsed: collectionsUsed.length > 0 ? collectionsUsed : collections,
      dataCount,
      reasoningSteps: showReasoning && reasoningSteps.length > 0 ? reasoningSteps : undefined,
    })
  } catch (error: any) {
    console.error('Error in preview API:', error)
    return NextResponse.json(
      {
        error: 'Failed to preview agent',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

