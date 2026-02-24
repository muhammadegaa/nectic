/**
 * Demo Chat API - No auth, no Firebase required
 * POST /api/chat/demo - Chat with embedded sample finance data
 * Only needs OPENAI_API_KEY. Works out of the box.
 */

import { NextRequest, NextResponse } from 'next/server'
import { agentTools } from '@/lib/agent-tools'
import { executeDemoTool } from '@/lib/demo-tool-executor'
import { buildSystemPrompt } from '@/lib/agentic-prompt-builder'
import { callLLM } from '@/lib/llm-client'

export const dynamic = 'force-dynamic'

const DEMO_COLLECTIONS = ['finance_transactions']
const DEMO_TOOLS = agentTools.filter((t) =>
  ['query_collection', 'analyze_data', 'get_collection_schema'].includes(t.function.name)
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Add OPENAI_API_KEY to your environment.' },
        { status: 500 }
      )
    }

    const systemPrompt = buildSystemPrompt(DEMO_COLLECTIONS, {
      responseStyle: { tone: 'conversational', detailLevel: 'moderate', includeNumbers: true },
      reasoning: { enabled: true, depth: 'moderate', showReasoning: false },
    })

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]

    const llmResponse = await callLLM('openai', 'gpt-4o', {
      messages,
      tools: DEMO_TOOLS,
      tool_choice: 'auto',
      temperature: 0.3,
      max_tokens: 1500,
      user: 'demo-user',
    })

    const toolCalls = llmResponse.tool_calls || []
    let response: string

    if (toolCalls.length > 0) {
      const toolResults: any[] = []
      for (const toolCall of toolCalls) {
        try {
          const name = toolCall.function?.name
          const args = JSON.parse(toolCall.function?.arguments || '{}')
          const result = await executeDemoTool(name, args)
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name,
            content: JSON.stringify(result),
          })
        } catch (err: any) {
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolCall.function?.name,
            content: JSON.stringify({ error: err?.message || 'Tool failed' }),
          })
        }
      }

      const finalRes = await callLLM('openai', 'gpt-4o', {
        messages: [
          ...messages,
          { role: 'assistant', content: llmResponse.content, tool_calls: toolCalls },
          ...toolResults,
        ],
        temperature: 0.3,
        max_tokens: 1500,
        user: 'demo-user',
      })
      response = finalRes.content || 'I could not generate a response.'
    } else {
      response = llmResponse.content || 'I could not generate a response.'
    }

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Demo chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get response', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
