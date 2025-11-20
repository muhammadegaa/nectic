/**
 * Tool Executors - Execute agent tools and return results
 * These functions are called by the LLM via OpenAI Function Calling
 */

import { getAdminDb } from '@/infrastructure/firebase/firebase-server'
import { CollectionName, collectionSchemas } from './agent-tools'
import { executePowerfulTool } from './powerful-tool-executors'

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
 * Execute a tool call from the LLM
 */
export async function executeTool(toolName: string, args: any): Promise<any> {
  try {
    // Check if it's a powerful tool first
    const powerfulToolNames = [
      'budget_vs_actual', 'cash_flow_forecast', 'revenue_trend_analysis',
      'expense_categorization_analysis', 'financial_health_score',
      'pipeline_health', 'win_rate_analysis', 'sales_forecast',
      'at_risk_deals_detection', 'conversion_funnel_analysis',
      'team_capacity_analysis', 'performance_trends', 'retention_risk_analysis',
      'hiring_needs_prediction', 'correlate_finance_sales',
      'department_performance_comparison', 'trend_forecasting',
      'what_if_scenario', 'pattern_recognition'
    ]
    
    if (powerfulToolNames.includes(toolName)) {
      return await executePowerfulTool(toolName, args)
    }
    
    // Basic tools
    switch (toolName) {
      case "query_collection":
        return await queryCollectionWithFilters(args.collection, args.filters || {})
      
      case "analyze_data":
        return await analyzeData(args.data, args.analysisType, args.groupBy, args.metric)
      
      case "get_collection_schema":
        return await getCollectionSchema(args.collection)
      
      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  } catch (error: any) {
    return {
      error: error.message || "Tool execution failed",
      tool: toolName,
      args
    }
  }
}

/**
 * Query a Firestore collection with dynamic filters
 */
async function queryCollectionWithFilters(
  collection: CollectionName,
  filters: QueryFilters
): Promise<any[]> {
  const adminDb = getAdminDb()
  let query: FirebaseFirestore.Query = adminDb.collection(collection)
  
  // Apply filters dynamically
  if (filters.dateRange) {
    const startDate = new Date(filters.dateRange.start)
    const endDate = new Date(filters.dateRange.end)
    
    // Determine date field based on collection
    const dateField = collection === "finance_transactions" ? "date" :
                     collection === "sales_deals" ? "expectedCloseDate" :
                     collection === "hr_employees" ? "hireDate" : "createdAt"
    
    query = query.where(dateField, ">=", startDate.toISOString().split('T')[0])
    query = query.where(dateField, "<=", endDate.toISOString().split('T')[0])
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
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
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

