/**
 * Tool Executors - Execute agent tools and return results
 * These functions are called by the LLM via OpenAI Function Calling
 */

import { getAdminDb } from '@/infrastructure/firebase/firebase-server'
import { CollectionName, collectionSchemas } from './agent-tools'
import { executePowerfulTool } from './powerful-tool-executors'
import { createAdapter } from './db-adapters/adapter-factory'
import { executeIntegrationTool } from './integration-tool-executors'
import type { DatabaseConnection } from './db-adapters/base-adapter'
import { safeQueryFirestore } from '@/infrastructure/firestore/safeQuery'
import { logToolCall } from '@/infrastructure/audit-log.repository'
import { FirebaseAgentRepository } from '@/infrastructure/repositories/firebase-agent.repository'
import type { Agent } from '@/domain/entities/agent.entity'
import { AccessDeniedError } from '@/domain/errors/access-errors'

export interface QueryFilters {
  dateRange?: { start: string; end: string }
  category?: string
  status?: string
  minAmount?: number
  maxAmount?: number
  department?: string
  limit?: number
  orderBy?: string
  orderDirection?: "asc" | "desc"
}

/**
 * Get allowed tools for an agent
 */
async function getAllowedTools(agentId: string, userId: string): Promise<string[] | null> {
  if (!agentId || !userId) return null
  
  try {
    const agentRepo = new FirebaseAgentRepository()
    const agent: Agent | null = await agentRepo.findById(agentId)
    if (!agent || agent.userId !== userId) return null
    
    // If explicit allowedTools is set, use it
    // Type assertion needed because TypeScript may not infer optional property correctly
    const agentWithTools = agent as Agent & { allowedTools?: string[] }
    if (agentWithTools.allowedTools && Array.isArray(agentWithTools.allowedTools) && agentWithTools.allowedTools.length > 0) {
      return agentWithTools.allowedTools
    }
    
    // Otherwise, derive from agenticConfig
    if (agent.agenticConfig?.tools) {
      const tools: string[] = []
      if (agent.agenticConfig.tools.basic.queryCollection) tools.push('query_collection')
      if (agent.agenticConfig.tools.basic.analyzeData) tools.push('analyze_data')
      if (agent.agenticConfig.tools.basic.getCollectionSchema) tools.push('get_collection_schema')
      
      // Add powerful tools
      const powerfulTools = [
        ...(agent.agenticConfig.tools.powerful.finance || []),
        ...(agent.agenticConfig.tools.powerful.sales || []),
        ...(agent.agenticConfig.tools.powerful.hr || []),
        ...(agent.agenticConfig.tools.powerful.crossCollection || []),
        ...(agent.agenticConfig.tools.powerful.advanced || []),
      ].map(t => `powerful_${t}`)
      tools.push(...powerfulTools)
      
      return tools.length > 0 ? tools : null
    }
    
    // No restrictions if no config
    return null
  } catch {
    return null
  }
}

/**
 * Create safe input summary for logging (no sensitive data)
 */
function createInputSummary(toolName: string, args: any): string {
  try {
    if (toolName === 'query_collection') {
      return JSON.stringify({
        collection: args.collection,
        filterFields: args.filters ? Object.keys(args.filters) : [],
        limit: args.filters?.limit,
      })
    }
    if (toolName === 'analyze_data') {
      return JSON.stringify({
        collection: args.collection,
        analysisType: args.analysisType,
        groupBy: args.groupBy,
      })
    }
    if (toolName.startsWith('powerful_')) {
      return JSON.stringify({
        tool: toolName,
        argsKeys: Object.keys(args || {}),
      })
    }
    // For integration tools, be very conservative
    if (toolName.includes('_')) {
      return JSON.stringify({
        tool: toolName,
        hasArgs: !!args,
      })
    }
    return JSON.stringify({ tool: toolName })
  } catch {
    return `tool: ${toolName}`
  }
}

/**
 * Execute a tool call from the LLM
 */
export async function executeTool(
  toolName: string, 
  args: any, 
  databaseConnection?: DatabaseConnection,
  userId?: string,
  agentId?: string
): Promise<any> {
  const startTime = Date.now()
  const timestamp = new Date()
  const inputSummary = createInputSummary(toolName, args)
  
  // Check tool allowlist if agentId/userId provided
  if (agentId && userId) {
    const allowedTools = await getAllowedTools(agentId, userId)
    if (allowedTools !== null && !allowedTools.includes(toolName)) {
      const errorMsg = `Tool ${toolName} is not allowed for this agent. Allowed tools: ${allowedTools.join(', ')}`
      await logToolCall({
        userId,
        agentId,
        toolName,
        inputSummary,
        success: false,
        errorMessage: errorMsg,
        timestamp,
        durationMs: Date.now() - startTime,
      })
      throw new AccessDeniedError(errorMsg)
    }
  }
  
  let result: any
  
  try {
    
    // Check if it's an integration tool (external service)
    if (toolName.includes('_') && (
      toolName.startsWith('slack_') ||
      toolName.startsWith('google_') ||
      toolName.startsWith('sheets_') ||
      toolName.startsWith('gmail_') ||
      toolName.startsWith('salesforce_') ||
      toolName.startsWith('notion_') ||
      toolName.startsWith('stripe_') ||
      toolName.startsWith('hubspot_') ||
      toolName.startsWith('zendesk_') ||
      toolName.startsWith('jira_') ||
      toolName.startsWith('asana_') ||
      toolName.startsWith('trello_')
    )) {
      result = await executeIntegrationTool(toolName, args, userId || '')
    }
    // Check if it's a powerful tool
    // Note: Powerful tools may do direct Firestore queries for complex business logic
    // This is acceptable as they implement domain-specific analytics, not raw data access
    else if (toolName.startsWith('powerful_')) {
      result = await executePowerfulTool(toolName, args, agentId || undefined, userId || undefined)
    }

    // Handle database adapter queries
    if (databaseConnection && databaseConnection.type !== 'firestore') {
      const adapter = createAdapter(databaseConnection)
      if (toolName === 'query_collection' || toolName === 'query_table') {
        const result = await adapter.query(args.collection || args.table, args.filters || {})
        return result.data // Return the data array from QueryResult
      }
      if (toolName === 'analyze_data') {
        const result = await adapter.query(args.collection || args.table, {})
        return await analyzeData(
          result.data, // Use data array from QueryResult
          args.analysisType,
          args.groupBy,
          args.metric
        )
      }
    }

    // Default: Firestore queries - use S-DAL
    if (toolName === 'query_collection') {
      const collection = args.collection as CollectionName
      const filters: QueryFilters = args.filters || {}
      
      // Use S-DAL if agentId and userId are provided (Firestore queries)
      if (agentId && userId && (!databaseConnection || databaseConnection.type === 'firestore')) {
        // Convert QueryFilters to S-DAL filter format
        const safeFilters: Array<{ field: string; op: string; value: unknown }> = []
        
        if (filters.dateRange) {
          const dateField = collection === "finance_transactions" ? "date" : 
                           collection === "sales_deals" ? "expectedCloseDate" : 
                           collection === "hr_employees" ? "hireDate" : "createdAt"
          safeFilters.push({ field: dateField, op: ">=", value: filters.dateRange.start })
          safeFilters.push({ field: dateField, op: "<=", value: filters.dateRange.end })
        }
        
        if (filters.category) {
          safeFilters.push({ field: "category", op: "==", value: filters.category })
        }
        
        if (filters.status) {
          safeFilters.push({ field: "status", op: "==", value: filters.status })
        }
        
        if (filters.department) {
          safeFilters.push({ field: "department", op: "==", value: filters.department })
        }
        
        if (filters.minAmount !== undefined) {
          const amountField = collection === "finance_transactions" ? "amount" : "value"
          safeFilters.push({ field: amountField, op: ">=", value: filters.minAmount })
        }
        
        if (filters.maxAmount !== undefined) {
          const amountField = collection === "finance_transactions" ? "amount" : "value"
          safeFilters.push({ field: amountField, op: "<=", value: filters.maxAmount })
        }
        
        const queryResult = await safeQueryFirestore({
          agentId,
          userId,
          collection,
          filters: safeFilters,
          limit: filters.limit || 50,
          orderBy: filters.orderBy ? {
            field: filters.orderBy,
            direction: filters.orderDirection || 'desc'
          } : undefined,
        })
        
        result = queryResult.rows
      } else {
        // Fallback to direct query if no agentId/userId (legacy support, not recommended)
      const adminDb = getAdminDb()
      let query: FirebaseFirestore.Query = adminDb.collection(collection)
      
      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)
        const dateField = collection === "finance_transactions" ? "date" : 
                         collection === "sales_deals" ? "expectedCloseDate" : 
                         collection === "hr_employees" ? "hireDate" : "createdAt"
        query = query.where(dateField, ">=", startDate.toISOString())
                     .where(dateField, "<=", endDate.toISOString())
      }
      
      if (filters.category) {
        query = query.where("category", "==", filters.category)
      }
      
      if (filters.status) {
        query = query.where("status", "==", filters.status)
      }
  
  if (filters.department) {
    query = query.where("department", "==", filters.department)
  }
  
  if (filters.minAmount !== undefined) {
    const amountField = collection === "finance_transactions" ? "amount" : "value"
    query = query.where(amountField, ">=", filters.minAmount)
  }
  
  if (filters.maxAmount !== undefined) {
    const amountField = collection === "finance_transactions" ? "amount" : "value"
    query = query.where(amountField, "<=", filters.maxAmount)
  }
  
  // Apply ordering
  if (filters.orderBy) {
    const orderField = filters.orderBy === "date" 
      ? (collection === "finance_transactions" ? "date" : 
         collection === "sales_deals" ? "expectedCloseDate" : "hireDate")
      : filters.orderBy
    
    query = query.orderBy(
      orderField,
      filters.orderDirection || "desc"
    )
  } else {
    // Default ordering by date/createdAt
    const defaultOrderField = collection === "finance_transactions" ? "date" :
                             collection === "sales_deals" ? "createdAt" :
                             collection === "hr_employees" ? "hireDate" : "createdAt"
    query = query.orderBy(defaultOrderField, "desc")
  }
  
  // Apply limit
  const limit = filters.limit || 50
  query = query.limit(limit)
  
  const snapshot = await query.get()
      result = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
      }
    } else if (toolName === 'analyze_data') {
      const collection = args.collection as CollectionName
      
      // Use S-DAL if agentId and userId are provided (Firestore queries)
      if (agentId && userId && (!databaseConnection || databaseConnection.type === 'firestore')) {
        const queryResult = await safeQueryFirestore({
          agentId,
          userId,
          collection,
          filters: [],
          limit: 100,
        })
        result = await analyzeData(queryResult.rows, args.analysisType, args.groupBy, args.metric)
      } else {
        // Fallback for non-Firestore or legacy paths
        const adminDb = getAdminDb()
        const snapshot = await adminDb.collection(collection).limit(100).get()
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        result = await analyzeData(data, args.analysisType, args.groupBy, args.metric)
      }
    } else if (toolName === 'get_collection_schema') {
      result = await getCollectionSchema(args.collection as CollectionName)
    } else {
      throw new Error(`Unknown tool: ${toolName}`)
    }
    // Log successful execution
    if (agentId && userId) {
      await logToolCall({
        userId,
        agentId,
        toolName,
        inputSummary,
        success: true,
        timestamp,
        durationMs: Date.now() - startTime,
      })
    }
    
    return result
  } catch (error: any) {
    console.error(`Error executing tool ${toolName}:`, error)
    
    // Log failed execution
    if (agentId && userId) {
      const errorMessage = error.message || 'Tool execution failed'
      await logToolCall({
        userId,
        agentId,
        toolName,
        inputSummary,
        success: false,
        errorMessage,
        timestamp,
        durationMs: Date.now() - startTime,
      })
    }
    
    return { error: error.message || 'Tool execution failed' }
  }
}

/**
 * Analyze data for trends, anomalies, patterns
 */
async function analyzeData(
  data: any[],
  analysisType: string,
  groupBy?: string,
  metric?: string
): Promise<any> {
  if (!data || data.length === 0) {
    return { error: "No data provided for analysis" }
  }
  
  switch (analysisType) {
    case "statistics": {
      const amountField = metric || "amount" || "value"
      const amounts = data
        .map(item => item[amountField])
        .filter(val => typeof val === "number")
      
      if (amounts.length === 0) {
        return { error: "No numeric data found for statistics" }
      }
      
      const sum = amounts.reduce((a, b) => a + b, 0)
      const avg = sum / amounts.length
      const min = Math.min(...amounts)
      const max = Math.max(...amounts)
      const count = amounts.length
      
      return {
        type: "statistics",
        metric: amountField,
        count,
        sum,
        average: avg,
        min,
        max,
        range: max - min
      }
    }
    
    case "trend": {
      // Group by time period and calculate trends
      const grouped: Record<string, any[]> = {}
      
      data.forEach(item => {
        const date = item.date || item.expectedCloseDate || item.hireDate || item.createdAt
        if (!date) return
        
        // Extract month-year as key
        const monthKey = date.substring(0, 7) // YYYY-MM
        if (!grouped[monthKey]) {
          grouped[monthKey] = []
        }
        grouped[monthKey].push(item)
      })
      
      const trendData = Object.entries(grouped)
        .map(([period, items]) => {
          const amountField = metric || "amount" || "value"
          const total = items
            .map(item => item[amountField] || 0)
            .reduce((a, b) => a + b, 0)
          
          return { period, count: items.length, total }
        })
        .sort((a, b) => a.period.localeCompare(b.period))
      
      return {
        type: "trend",
        periods: trendData,
        direction: trendData.length >= 2 
          ? (trendData[trendData.length - 1].total > trendData[0].total ? "increasing" : "decreasing")
          : "insufficient_data"
      }
    }
    
    case "anomaly": {
      const amountField = metric || "amount" || "value"
      const amounts = data
        .map(item => item[amountField])
        .filter(val => typeof val === "number")
      
      if (amounts.length === 0) {
        return { error: "No numeric data found for anomaly detection" }
      }
      
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const stdDev = Math.sqrt(
        amounts.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / amounts.length
      )
      
      const threshold = avg + (2 * stdDev) // 2 standard deviations
      const anomalies = data.filter(item => {
        const value = item[amountField]
        return typeof value === "number" && value > threshold
      })
      
      return {
        type: "anomaly",
        threshold,
        average: avg,
        standardDeviation: stdDev,
        anomalies: anomalies.map(item => ({
          id: item.id,
          value: item[amountField],
          ...(item.description ? { description: item.description } : {}),
          ...(item.name ? { name: item.name } : {})
        }))
      }
    }
    
    case "summary": {
      return {
        type: "summary",
        totalRecords: data.length,
        sample: data.slice(0, 5),
        fields: Object.keys(data[0] || {})
      }
    }
    
    case "comparison": {
      if (!groupBy) {
        return { error: "groupBy field required for comparison analysis" }
      }
      
      const grouped: Record<string, any[]> = {}
      data.forEach(item => {
        const key = item[groupBy] || "unknown"
        if (!grouped[key]) {
          grouped[key] = []
        }
        grouped[key].push(item)
      })
      
      const amountField = metric || "amount" || "value"
      const comparison = Object.entries(grouped).map(([group, items]) => {
        const total = items
          .map(item => item[amountField] || 0)
          .reduce((a, b) => a + b, 0)
        
        return {
          group,
          count: items.length,
          total,
          average: total / items.length
        }
      })
      
      return {
        type: "comparison",
        groupBy,
        groups: comparison
      }
    }
    
    default:
      return { error: `Unknown analysis type: ${analysisType}` }
  }
}

/**
 * Get collection schema
 */
async function getCollectionSchema(collection: CollectionName): Promise<any> {
  return {
    collection,
    schema: collectionSchemas[collection],
    description: `Schema for ${collection} collection`
  }
}

