/**
 * Query Planner - Multi-step query planning for complex questions
 * Breaks down complex questions into sub-queries and plans execution order
 */

export interface QueryStep {
  id: string
  tool: string
  args: any
  dependsOn?: string[] // IDs of steps this depends on
  description: string
}

export interface QueryPlan {
  steps: QueryStep[]
  estimatedTime: number
  complexity: 'simple' | 'moderate' | 'complex'
}

/**
 * Analyze a question and determine if it needs multi-step planning
 */
export function needsMultiStepPlanning(question: string): boolean {
  const complexIndicators = [
    'and', 'also', 'compare', 'trend', 'over time', 'versus', 'vs',
    'both', 'multiple', 'different', 'various', 'across', 'between'
  ]
  
  const lowerQuestion = question.toLowerCase()
  return complexIndicators.some(indicator => lowerQuestion.includes(indicator))
}

/**
 * Generate a query plan for a complex question
 * This is a helper that the LLM can use to plan multi-step queries
 */
export function generateQueryPlan(question: string, availableCollections: string[]): QueryPlan {
  const lowerQuestion = question.toLowerCase()
  const steps: QueryStep[] = []
  
  // Detect if question asks for trends over time
  if (lowerQuestion.includes('trend') || lowerQuestion.includes('over time') || lowerQuestion.includes('last')) {
    // Extract time period
    let timeRange = { start: '', end: '' }
    if (lowerQuestion.includes('last month')) {
      const now = new Date()
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      timeRange.start = lastMonth.toISOString().split('T')[0]
      timeRange.end = now.toISOString().split('T')[0]
    } else if (lowerQuestion.includes('last year')) {
      const now = new Date()
      const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1)
      timeRange.start = lastYear.toISOString().split('T')[0]
      timeRange.end = now.toISOString().split('T')[0]
    } else if (lowerQuestion.includes('last 3 months')) {
      const now = new Date()
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      timeRange.start = threeMonthsAgo.toISOString().split('T')[0]
      timeRange.end = now.toISOString().split('T')[0]
    }
    
    if (timeRange.start) {
      availableCollections.forEach(collection => {
        if (lowerQuestion.includes(collection.replace(/_/g, ' ')) || lowerQuestion.includes('all')) {
          steps.push({
            id: `query_${collection}_trend`,
            tool: 'query_collection',
            args: {
              collection,
              filters: {
                dateRange: timeRange,
                limit: 100,
                orderBy: 'date',
                orderDirection: 'asc'
              }
            },
            description: `Query ${collection} data for trend analysis`
          })
        }
      })
    }
  }
  
  // Detect if question asks for comparison
  if (lowerQuestion.includes('compare') || lowerQuestion.includes('versus') || lowerQuestion.includes('vs')) {
    // This would need more sophisticated parsing
    // For now, query relevant collections
    availableCollections.forEach(collection => {
      if (lowerQuestion.includes(collection.replace(/_/g, ' '))) {
        steps.push({
          id: `query_${collection}_compare`,
          tool: 'query_collection',
          args: {
            collection,
            filters: { limit: 50 }
          },
          description: `Query ${collection} for comparison`
        })
      }
    })
  }
  
  // If no specific plan detected, create a simple query plan
  if (steps.length === 0) {
    const primaryCollection = availableCollections[0]
    steps.push({
      id: 'query_primary',
      tool: 'query_collection',
      args: {
        collection: primaryCollection,
        filters: { limit: 50 }
      },
      description: `Query ${primaryCollection} data`
    })
  }
  
  // Add analysis step if needed
  if (lowerQuestion.includes('trend') || lowerQuestion.includes('analyze') || lowerQuestion.includes('pattern')) {
    steps.push({
      id: 'analyze_data',
      tool: 'analyze_data',
      args: {
        data: '${query_primary}', // Reference to previous step
        analysisType: lowerQuestion.includes('trend') ? 'trend' : 
                     lowerQuestion.includes('anomaly') ? 'anomaly' : 'summary'
      },
      dependsOn: steps.map(s => s.id).filter(id => id.startsWith('query_')),
      description: 'Analyze the queried data'
    })
  }
  
  return {
    steps,
    estimatedTime: steps.length * 2, // 2 seconds per step estimate
    complexity: steps.length > 2 ? 'complex' : steps.length > 1 ? 'moderate' : 'simple'
  }
}

/**
 * Execute a query plan step by step
 */
export async function executeQueryPlan(
  plan: QueryPlan,
  executeTool: (tool: string, args: any) => Promise<any>
): Promise<any[]> {
  const results: any[] = []
  const stepResults: Record<string, any> = {}
  
  // Execute steps in order (respecting dependencies)
  for (const step of plan.steps) {
    // Wait for dependencies
    if (step.dependsOn) {
      for (const depId of step.dependsOn) {
        if (!stepResults[depId]) {
          // Find the step and execute it first
          const depStep = plan.steps.find(s => s.id === depId)
          if (depStep) {
            stepResults[depId] = await executeTool(depStep.tool, depStep.args)
          }
        }
      }
    }
    
    // Replace references in args with actual results
    const resolvedArgs = resolveArgs(step.args, stepResults)
    
    // Execute step
    const result = await executeTool(step.tool, resolvedArgs)
    stepResults[step.id] = result
    results.push(result)
  }
  
  return results
}

/**
 * Resolve argument references (e.g., ${query_primary}) with actual values
 */
function resolveArgs(args: any, stepResults: Record<string, any>): any {
  if (typeof args === 'string' && args.startsWith('${') && args.endsWith('}')) {
    const refId = args.slice(2, -1)
    return stepResults[refId] || args
  }
  
  if (Array.isArray(args)) {
    return args.map(arg => resolveArgs(arg, stepResults))
  }
  
  if (typeof args === 'object' && args !== null) {
    const resolved: any = {}
    for (const [key, value] of Object.entries(args)) {
      resolved[key] = resolveArgs(value, stepResults)
    }
    return resolved
  }
  
  return args
}

