/**
 * Demo Chat API - No auth required
 * POST /api/chat/demo - Chat with pre-seeded Finance data
 */

import { NextRequest, NextResponse } from 'next/server'
import { agentTools } from '@/lib/agent-tools'
import { powerfulTools } from '@/lib/powerful-tools'
import { executeTool } from '@/lib/tool-executors'
import { buildSystemPrompt, filterTools } from '@/lib/agentic-prompt-builder'
import { callLLM } from '@/lib/llm-client'

export const dynamic = 'force-dynamic'

const DEMO_COLLECTIONS = ['finance_transactions', 'finance_budgets']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const systemPrompt = buildSystemPrompt(DEMO_COLLECTIONS, undefined)
    const availableTools = filterTools(undefined)
    const tools = availableTools.length > 0 ? availableTools : [...agentTools, ...powerfulTools]

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]

    let assistantMessage: any
    let toolCalls: any[] = []

    const llmResponse = await callLLM(
      'openai',
      'gpt-4o',
      {
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 1500,
        user: 'demo-user',
      }
    )

    assistantMessage = {
      role: 'assistant',
      content: llmResponse.content,
      tool_calls: llmResponse.tool_calls,
    }
    toolCalls = llmResponse.tool_calls || []

    let response: string

    if (toolCalls.length > 0) {
      const toolResults: any[] = []
      for (const toolCall of toolCalls) {
        try {
          const functionName = toolCall.function.name
          const functionArgs = JSON.parse(toolCall.function.arguments)
          const result = await executeTool(functionName, functionArgs, undefined, undefined, undefined)
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: JSON.stringify(result)
          })
        } catch (error: any) {
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolCall.function.name,
            content: JSON.stringify({ error: error.message || 'Tool execution failed' })
          })
        }
      }

      const finalLLMResponse = await callLLM(
        'openai',
        'gpt-4o',
        {
          messages: [
            ...messages,
            assistantMessage,
            ...toolResults,
          ],
          temperature: 0.3,
          max_tokens: 1500,
          user: 'demo-user',
        }
      )
      response = finalLLMResponse.content || 'I could not generate a response.'
    } else {
      response = assistantMessage.content || 'I could not generate a response.'
    }

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Demo chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get response', message: error.message },
      { status: 500 }
    )
  }
}
