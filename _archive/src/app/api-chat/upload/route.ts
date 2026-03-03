/**
 * Chat on uploaded data - uses session from /api/upload
 * POST /api/chat/upload - { sessionId, message }
 * Returns: { response, sources?: { rowIndices: number[] } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { agentTools } from '@/lib/agent-tools'
import { getUploadSession } from '@/lib/upload-store'
import { executeUploadTool } from '@/lib/upload-tool-executor'
import { buildSystemPrompt } from '@/lib/agentic-prompt-builder'
import { callLLM } from '@/lib/llm-client'

export const dynamic = 'force-dynamic'

const UPLOAD_TOOLS = agentTools.filter((t) =>
  ['query_collection', 'analyze_data', 'get_collection_schema'].includes(t.function.name)
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message } = body

    if (!sessionId || !message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'sessionId and message are required' },
        { status: 400 }
      )
    }

    const session = await getUploadSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session expired or not found. Please upload your file again.' },
        { status: 404 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured.' },
        { status: 500 }
      )
    }

    const collectionName = 'uploaded_data'
    const systemPrompt = buildSystemPrompt([collectionName], {
      responseStyle: {
        tone: 'conversational',
        detailLevel: 'moderate',
        includeNumbers: true,
        includeSources: true,
        formatOutput: true,
      },
      reasoning: { enabled: true, depth: 'moderate', showReasoning: false, maxSteps: 5 },
    }) + `\n\nYour data has ${session.rowCount} rows with columns: ${session.schema.fields.join(', ')}. When citing data, mention row numbers (e.g., "Based on rows 1–15").`

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]

    const llmResponse = await callLLM('openai', 'gpt-4o', {
      messages,
      tools: UPLOAD_TOOLS,
      tool_choice: 'auto',
      temperature: 0.3,
      max_tokens: 1500,
      user: `upload:${sessionId}`,
    })

    const toolCalls = llmResponse.tool_calls || []
    let response: string
    const citedRows = new Set<number>()

    if (toolCalls.length > 0) {
      const toolResults: any[] = []
      for (const toolCall of toolCalls) {
        try {
          const name = toolCall.function?.name
          const args = JSON.parse(toolCall.function?.arguments || '{}')
          const result = executeUploadTool(session, name, args)
          if (Array.isArray(result)) {
            result.forEach((row: any) => {
              if (typeof row?._rowIndex === 'number') citedRows.add(row._rowIndex)
            })
          }
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
        user: `upload:${sessionId}`,
      })
      response = finalRes.content || 'I could not generate a response.'
    } else {
      response = llmResponse.content || 'I could not generate a response.'
    }

    const sources = citedRows.size > 0 ? { rowIndices: Array.from(citedRows).sort((a, b) => a - b) } : undefined

    return NextResponse.json({ response, sources })
  } catch (error: any) {
    console.error('Upload chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get response', message: error?.message },
      { status: 500 }
    )
  }
}
