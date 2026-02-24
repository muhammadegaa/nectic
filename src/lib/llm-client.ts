/**
 * LLM Client - Unified interface for multiple LLM providers
 * Supports OpenAI, Anthropic, Google, and custom APIs
 */

interface LLMRequest {
  model: string
  messages: any[]
  tools?: any[]
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  temperature?: number
  max_tokens?: number
  user?: string
}

interface LLMResponse {
  content: string
  tool_calls?: Array<{
    id: string
    function: {
      name: string
      arguments: string
    }
  }>
}

/**
 * Call LLM API based on provider
 */
export async function callLLM(
  provider: 'openai' | 'anthropic' | 'google' | 'custom',
  model: string,
  request: Omit<LLMRequest, 'model'>,
  apiKey?: string
): Promise<LLMResponse> {
  const effectiveApiKey = apiKey || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_API_KEY

  switch (provider) {
    case 'openai':
      return await callOpenAI(model, request, effectiveApiKey)
    
    case 'anthropic':
      return await callAnthropic(model, request, effectiveApiKey)
    
    case 'google':
      return await callGoogle(model, request, effectiveApiKey)
    
    case 'custom':
      throw new Error('Custom API provider not yet implemented')
    
    default:
      // Default to OpenAI
      return await callOpenAI(model, request, effectiveApiKey)
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  model: string,
  request: Omit<LLMRequest, 'model'>,
  apiKey?: string
): Promise<LLMResponse> {
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      ...request,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`OpenAI API error: ${response.statusText} - ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  const message = data.choices[0]?.message

  return {
    content: message.content || '',
    tool_calls: message.tool_calls?.map((tc: any) => ({
      id: tc.id,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments,
      },
    })),
  }
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  model: string,
  request: Omit<LLMRequest, 'model'>,
  apiKey?: string
): Promise<LLMResponse> {
  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  // Anthropic API has different format
  const anthropicMessages = request.messages
    .filter((m: any) => m.role !== 'system') // System messages handled separately
    .map((m: any) => {
      if (m.role === 'tool') {
        return {
          role: 'user',
          content: `Tool result: ${m.content}`,
        }
      }
      return {
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }
    })

  const systemMessage = request.messages.find((m: any) => m.role === 'system')?.content || ''

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: anthropicMessages,
      system: systemMessage,
      max_tokens: request.max_tokens || 1024,
      temperature: request.temperature || 0.7,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Anthropic API error: ${response.statusText} - ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  const content = data.content?.[0]?.text || ''

  // Anthropic doesn't support function calling in the same way
  // For now, return content only
  return {
    content,
    tool_calls: undefined,
  }
}

/**
 * Call Google (Gemini) API
 */
async function callGoogle(
  model: string,
  request: Omit<LLMRequest, 'model'>,
  apiKey?: string
): Promise<LLMResponse> {
  if (!apiKey) {
    throw new Error('Google API key not configured')
  }

  // Google API has different format
  const contents = request.messages
    .filter((m: any) => m.role !== 'system')
    .map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const systemInstruction = request.messages.find((m: any) => m.role === 'system')?.content

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.max_tokens || 1024,
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Google API error: ${response.statusText} - ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Google doesn't support function calling in the same way
  return {
    content,
    tool_calls: undefined,
  }
}

