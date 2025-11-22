/**
 * Cost Optimization - Smart Engage Equivalent
 * Pre-screens messages with lightweight models to reduce LLM costs by 80%
 */

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface MessageFilter {
  shouldProcess: boolean
  confidence: number
  reason?: string
  suggestedResponse?: string
}

/**
 * Pre-screen message with lightweight model to determine if it needs full LLM processing
 * This reduces costs by filtering out:
 * - Greetings/small talk (can use cached responses)
 * - Off-topic questions (can reject early)
 * - Simple queries (can use lightweight model)
 */
export async function preScreenMessage(
  message: string,
  agentCollections: string[],
  conversationHistory: any[] = []
): Promise<MessageFilter> {
  try {
    // Use lightweight model (gpt-3.5-turbo) for pre-screening
    const screeningPrompt = `You are a message pre-screener. Analyze if this message needs full AI processing or can be handled simply.

User message: "${message}"

Available data collections: ${agentCollections.join(', ')}

Previous conversation context: ${conversationHistory.length > 0 ? 'Yes' : 'No'}

Determine:
1. Is this a greeting/small talk? (e.g., "hi", "thanks", "ok")
2. Is this off-topic or not related to the available data?
3. Is this a simple question that can be answered with a template response?
4. Does this require complex reasoning, data analysis, or tool usage?

Respond in JSON format:
{
  "shouldProcess": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation",
  "suggestedResponse": "if shouldProcess is false, provide a simple response"
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Lightweight model for pre-screening
      messages: [
        {
          role: 'system',
          content: screeningPrompt
        }
      ],
      temperature: 0.1, // Very low for consistent filtering
      max_tokens: 200, // Minimal tokens for cost savings
    })

    const content = response.choices[0]?.message?.content || '{}'
    const filter: MessageFilter = JSON.parse(content)

    return {
      shouldProcess: filter.shouldProcess !== false, // Default to true if unclear
      confidence: filter.confidence || 0.5,
      reason: filter.reason,
      suggestedResponse: filter.suggestedResponse
    }
  } catch (error) {
    console.error('Pre-screening error:', error)
    // On error, default to processing (fail open)
    return {
      shouldProcess: true,
      confidence: 0.5,
      reason: 'Pre-screening failed, processing normally'
    }
  }
}

/**
 * Check if message is a simple greeting/small talk
 */
export function isSimpleGreeting(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim()
  const greetings = ['hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'okay', 'yes', 'no', 'bye', 'goodbye']
  return greetings.some(g => lowerMessage === g || lowerMessage.startsWith(g + ' '))
}

/**
 * Check if message is off-topic
 */
export function isOffTopic(message: string, agentCollections: string[]): boolean {
  const lowerMessage = message.toLowerCase()
  const relevantKeywords = [
    ...agentCollections.flatMap(c => c.split('_')),
    'data', 'query', 'show', 'get', 'find', 'analyze', 'report', 'summary',
    'finance', 'sales', 'hr', 'employee', 'deal', 'transaction', 'revenue', 'expense'
  ]
  
  // If message doesn't contain any relevant keywords, might be off-topic
  const hasRelevantKeywords = relevantKeywords.some(keyword => lowerMessage.includes(keyword))
  return !hasRelevantKeywords && message.length > 20 // Only flag longer messages as potentially off-topic
}

/**
 * Get cached response for common queries
 */
export function getCachedResponse(message: string): string | null {
  const lowerMessage = message.toLowerCase().trim()
  
  const cachedResponses: Record<string, string> = {
    'hi': 'Hello! How can I help you analyze your data today?',
    'hello': 'Hello! How can I help you analyze your data today?',
    'thanks': "You're welcome! Let me know if you need anything else.",
    'thank you': "You're welcome! Let me know if you need anything else.",
  }
  
  return cachedResponses[lowerMessage] || null
}

/**
 * Smart Engage - Main cost optimization function
 * Returns whether to use full LLM or lightweight/cached response
 */
export async function smartEngage(
  message: string,
  agentCollections: string[],
  conversationHistory: any[] = [],
  enablePreScreening: boolean = true
): Promise<{ useFullLLM: boolean; response?: string; reason: string }> {
  // Quick checks first (no API call)
  const cached = getCachedResponse(message)
  if (cached) {
    return {
      useFullLLM: false,
      response: cached,
      reason: 'Cached response for common greeting'
    }
  }

  if (isSimpleGreeting(message)) {
    return {
      useFullLLM: false,
      response: 'Hello! How can I help you analyze your data today?',
      reason: 'Simple greeting - using template response'
    }
  }

  if (isOffTopic(message, agentCollections)) {
    return {
      useFullLLM: false,
      response: "I'm designed to help you analyze your enterprise data. Could you ask a question related to your data collections?",
      reason: 'Off-topic message - using template response'
    }
  }

  // Pre-screen with lightweight model if enabled
  if (enablePreScreening) {
    const filter = await preScreenMessage(message, agentCollections, conversationHistory)
    
    if (!filter.shouldProcess && filter.confidence > 0.7) {
      return {
        useFullLLM: false,
        response: filter.suggestedResponse || 'I can help you with data analysis. What would you like to know?',
        reason: filter.reason || 'Pre-screened as simple query'
      }
    }
  }

  // Use full LLM for complex queries
  return {
    useFullLLM: true,
    reason: 'Message requires full AI processing'
  }
}

/**
 * Estimate cost savings from Smart Engage
 */
export function estimateCostSavings(
  totalMessages: number,
  filteredMessages: number,
  fullLLMCost: number = 0.01, // $0.01 per message for gpt-4o
  lightweightCost: number = 0.001 // $0.001 per message for gpt-3.5-turbo
): { savings: number; savingsPercentage: number; totalCost: number; originalCost: number } {
  const originalCost = totalMessages * fullLLMCost
  const filteredCost = filteredMessages * lightweightCost
  const processedCost = (totalMessages - filteredMessages) * fullLLMCost
  const totalCost = filteredCost + processedCost
  const savings = originalCost - totalCost
  const savingsPercentage = (savings / originalCost) * 100

  return {
    savings,
    savingsPercentage,
    totalCost,
    originalCost
  }
}

