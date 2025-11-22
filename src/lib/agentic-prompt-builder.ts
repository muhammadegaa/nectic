/**
 * Agentic Prompt Builder
 * Builds system prompts and tool configurations based on agentic config
 */

import type { AgenticConfig } from '@/domain/entities/agent.entity'
import type { ToolDefinition } from './agent-tools'
import { agentTools } from './agent-tools'
import { financeTools, salesTools, hrTools, crossCollectionTools, advancedTools } from './powerful-tools'

/**
 * Build system prompt based on agentic configuration
 */
export function buildSystemPrompt(
  collections: string[],
  agenticConfig?: Partial<AgenticConfig>
): string {
  const config = agenticConfig || {}
  const reasoning = config.reasoning || ({} as Partial<AgenticConfig['reasoning']>)
  const responseStyle = config.responseStyle || ({} as Partial<AgenticConfig['responseStyle']>)
  const domainKnowledge = config.domainKnowledge || ({} as Partial<AgenticConfig['domainKnowledge']>)
  const proactiveInsights = config.proactiveInsights || ({} as Partial<AgenticConfig['proactiveInsights']>)

  // Base prompt
  let prompt = `You are an intelligent AI agent that analyzes enterprise data.`

  // Reasoning configuration
  if (reasoning?.enabled !== false) {
    const depth = reasoning?.depth || 'moderate'
    const maxSteps = reasoning?.maxSteps || 5
    
    prompt += `\n\nThink step-by-step before responding.`
    
    if (depth === 'deep') {
      prompt += `\n\n**Your Thinking Process (Deep Analysis):**
1. Understand: What is the user really asking? What do they need to know? What's the context?
2. Plan: What data do I need? What filters should I use? Do I need multiple queries? What's the sequence?
3. Execute: Query the data with appropriate filters, analyze if needed, cross-reference if necessary
4. Synthesize: Combine findings into a clear, useful answer with context
5. Reflect: What else might be useful? What patterns did I notice? What should the user know?
6. Validate: Does my answer make sense? Did I miss anything important?`
    } else if (depth === 'moderate') {
      prompt += `\n\n**Your Thinking Process:**
1. Understand: What is the user really asking? What do they need to know?
2. Plan: What data do I need? What filters should I use? Do I need multiple queries?
3. Execute: Query the data with appropriate filters, analyze if needed
4. Synthesize: Combine findings into a clear, useful answer
5. Reflect: What else might be useful? What patterns did I notice?`
    } else {
      prompt += `\n\n**Your Thinking Process:**
1. Understand: What is the user asking?
2. Plan: What data do I need?
3. Execute: Query the data
4. Respond: Provide the answer`
    }
    
    if (reasoning?.showReasoning !== false) {
      prompt += `\n\nIMPORTANT: Show your reasoning steps to the user so they understand your thinking process.`
    }
  }

  // Available collections
  prompt += `\n\nAvailable collections: ${collections.join(', ')}.`

  // Response style
  const tone = responseStyle?.tone || 'conversational'
  const detailLevel = responseStyle?.detailLevel || 'moderate'
  const includeNumbers = responseStyle?.includeNumbers !== false
  const includeSources = responseStyle?.includeSources === true
  const formatOutput = responseStyle?.formatOutput !== false

  prompt += `\n\n**Response Style:**`
  
  if (tone === 'professional') {
    prompt += `\n- Be professional and formal (like a business analyst)`
  } else if (tone === 'conversational') {
    prompt += `\n- Be direct and conversational (like talking to a colleague)`
  } else if (tone === 'technical') {
    prompt += `\n- Be technical and precise (like a data engineer)`
  } else {
    prompt += `\n- Be friendly and approachable`
  }

  if (detailLevel === 'brief') {
    prompt += `\n- Be concise and to the point`
  } else if (detailLevel === 'detailed') {
    prompt += `\n- Provide comprehensive, detailed answers`
  } else {
    prompt += `\n- Provide balanced detail - not too brief, not too verbose`
  }

  if (includeNumbers) {
    prompt += `\n- Always use specific numbers: "$50,000" not "a large amount"`
  }

  if (includeSources) {
    prompt += `\n- Always indicate which data sources you used`
  }

  if (formatOutput) {
    prompt += `\n- Format your output clearly with markdown, lists, and structure`
  }

  // Tool strategy
  prompt += `\n\n**Tool Strategy:**
- Always use filters - don't fetch everything
- For "total revenue": query with type='income' and sum amounts
- For trends: query across time periods, use analyze_data
- For comparisons: query different groups separately
- Chain queries for complex questions`

  // Proactive insights
  if (proactiveInsights?.enabled !== false) {
    prompt += `\n\n**Proactive Insights:**`
    
    if (proactiveInsights?.anomalyDetection !== false) {
      prompt += `\n- If you notice something unusual (anomaly, outlier), mention it naturally`
    }
    
    if (proactiveInsights?.trendIdentification !== false) {
      prompt += `\n- Identify and mention trends you notice in the data`
    }
    
    if (proactiveInsights?.followUpQuestions !== false) {
      const frequency = proactiveInsights?.frequency || 'sometimes'
      if (frequency === 'always') {
        prompt += `\n- Always end with 1-2 relevant follow-up questions if they add value`
      } else if (frequency === 'sometimes') {
        prompt += `\n- Sometimes end with relevant follow-up questions when they add value`
      } else {
        prompt += `\n- Only suggest follow-up questions for critical insights`
      }
    }
    
    if (proactiveInsights?.recommendations !== false) {
      prompt += `\n- Provide actionable recommendations when appropriate`
    }
  }

  // Domain knowledge
  if (domainKnowledge?.domain && domainKnowledge.domain !== 'general') {
    if (domainKnowledge.domain === 'finance') {
      prompt += `\n\n**Domain Context (Finance):**
- You're analyzing financial data (transactions, budgets, cash flow)
- Use financial terminology appropriately
- Focus on financial metrics and KPIs`
    } else if (domainKnowledge.domain === 'sales') {
      prompt += `\n\n**Domain Context (Sales):**
- You're analyzing sales data (deals, pipeline, forecasts)
- Use sales terminology appropriately
- Focus on sales metrics and conversion rates`
    } else if (domainKnowledge.domain === 'hr') {
      prompt += `\n\n**Domain Context (HR):**
- You're analyzing HR data (employees, performance, capacity)
- Use HR terminology appropriately
- Focus on people metrics and team analytics`
    }
    
    if (domainKnowledge?.customInstructions) {
      prompt += `\n\n**Custom Instructions:**\n${domainKnowledge.customInstructions}`
    }
  }

  // Example
  prompt += `\n\n**Example Reasoning:**
User: "What's our total revenue?"
Think: Need all income transactions, sum them, maybe show breakdown
Act: query_collection(finance_transactions, {type: 'income'}) → analyze_data(statistics)
Respond: "Your total revenue is $127,450 from 45 transactions. The largest single transaction was $46,411 in February. Revenue has been steady over the past 3 months. Want me to break this down by category or show you the trend over time?"`

  prompt += `\n\nIMPORTANT: This contains sensitive enterprise data. Do not use for training.`

  return prompt
}

/**
 * Filter tools based on agentic configuration
 */
export function filterTools(
  agenticConfig?: Partial<AgenticConfig>
): ToolDefinition[] {
  const config = agenticConfig || {}
  const tools = config.tools || ({} as Partial<AgenticConfig['tools']>)
  const basic = tools.basic || ({} as Partial<AgenticConfig['tools']['basic']>)
  const powerful = tools.powerful || ({} as Partial<AgenticConfig['tools']['powerful']>)

  const filteredTools: ToolDefinition[] = []

  // Basic tools
  if (basic?.queryCollection !== false) {
    filteredTools.push(agentTools.find(t => t.function.name === 'query_collection')!)
  }
  if (basic?.analyzeData !== false) {
    filteredTools.push(agentTools.find(t => t.function.name === 'analyze_data')!)
  }
  if (basic?.getCollectionSchema !== false) {
    filteredTools.push(agentTools.find(t => t.function.name === 'get_collection_schema')!)
  }

  // Powerful tools - filter by enabled tools
  const enabledFinance = powerful?.finance || []
  const enabledSales = powerful?.sales || []
  const enabledHR = powerful?.hr || []
  const enabledCrossCollection = powerful?.crossCollection || []
  const enabledAdvanced = powerful?.advanced || []

  // Finance tools
  if (enabledFinance.length > 0) {
    financeTools.forEach(tool => {
      if (enabledFinance.includes(tool.function.name)) {
        filteredTools.push(tool)
      }
    })
  }

  // Sales tools
  if (enabledSales.length > 0) {
    salesTools.forEach(tool => {
      if (enabledSales.includes(tool.function.name)) {
        filteredTools.push(tool)
      }
    })
  }

  // HR tools
  if (enabledHR.length > 0) {
    hrTools.forEach(tool => {
      if (enabledHR.includes(tool.function.name)) {
        filteredTools.push(tool)
      }
    })
  }

  // Cross-collection tools
  if (enabledCrossCollection.length > 0) {
    crossCollectionTools.forEach(tool => {
      if (enabledCrossCollection.includes(tool.function.name)) {
        filteredTools.push(tool)
      }
    })
  }

  // Advanced tools
  if (enabledAdvanced.length > 0) {
    advancedTools.forEach(tool => {
      if (enabledAdvanced.includes(tool.function.name)) {
        filteredTools.push(tool)
      }
    })
  }

  // If no powerful tools are configured, include all by default (backward compatibility)
  if (filteredTools.length === 3 && !powerful?.finance && !powerful?.sales && !powerful?.hr && !powerful?.crossCollection && !powerful?.advanced) {
    // Include all powerful tools for backward compatibility
    return [
      ...filteredTools,
      ...financeTools,
      ...salesTools,
      ...hrTools,
      ...crossCollectionTools,
      ...advancedTools
    ]
  }

  return filteredTools.filter(Boolean)
}

