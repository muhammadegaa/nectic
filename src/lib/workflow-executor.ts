/**
 * Workflow Executor
 * Executes visual workflows defined by nodes and edges
 * For MVP: Simple state machine executor
 */

import type { Node, Edge } from 'reactflow'
import { executeTool } from './tool-executors'
import type { DatabaseConnection } from './db-adapters/base-adapter'

export interface WorkflowContext {
  variables: Record<string, any>
  results: Record<string, any>
  userId?: string
  agentId?: string
  databaseConnection?: DatabaseConnection
}

export interface WorkflowResult {
  success: boolean
  output?: any
  error?: string
  steps: Array<{
    nodeId: string
    nodeType: string
    result?: any
    error?: string
  }>
}

/**
 * Execute a workflow
 */
export async function executeWorkflow(
  nodes: Node[],
  edges: Edge[],
  context: WorkflowContext
): Promise<WorkflowResult> {
  const steps: WorkflowResult['steps'] = []
  const visited = new Set<string>()
  
  // Find start node
  const startNode = nodes.find(n => n.type === 'start')
  if (!startNode) {
    return {
      success: false,
      error: 'No start node found in workflow',
      steps,
    }
  }

  // Build adjacency list for faster traversal
  const graph = buildGraph(nodes, edges)
  
  // Execute workflow starting from start node
  try {
    const output = await executeNode(startNode.id, nodes, edges, graph, context, visited, steps)
    
    return {
      success: true,
      output,
      steps,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Workflow execution failed',
      steps,
    }
  }
}

/**
 * Build graph from nodes and edges
 */
function buildGraph(nodes: Node[], edges: Edge[]): Map<string, string[]> {
  const graph = new Map<string, string[]>()
  
  nodes.forEach(node => {
    graph.set(node.id, [])
  })
  
  edges.forEach(edge => {
    const neighbors = graph.get(edge.source) || []
    neighbors.push(edge.target)
    graph.set(edge.source, neighbors)
  })
  
  return graph
}

/**
 * Execute a single node
 */
async function executeNode(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  graph: Map<string, string[]>,
  context: WorkflowContext,
  visited: Set<string>,
  steps: WorkflowResult['steps']
): Promise<any> {
  // Prevent infinite loops
  if (visited.has(nodeId)) {
    return context.results[nodeId]
  }
  visited.add(nodeId)
  
  const node = nodes.find(n => n.id === nodeId)
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`)
  }

  let result: any

  try {
    switch (node.type) {
      case 'start':
        // Start node: just continue to next node
        result = { status: 'started' }
        break

      case 'tool':
        // Execute tool
        const toolName = node.data.toolName
        const toolArgs = node.data.args || {}
        
        // Replace variables in args
        const resolvedArgs = resolveVariables(toolArgs, context.variables)
        
        result = await executeTool(
          toolName,
          resolvedArgs,
          context.databaseConnection,
          context.userId,
          context.agentId
        )
        break

      case 'decision':
        // Decision node: evaluate condition and choose path
        const condition = node.data.condition || ''
        const conditionResult = evaluateCondition(condition, context.variables)
        
        // Find edges from this node
        const decisionEdges = edges.filter(e => e.source === nodeId)
        // For MVP: first edge = true path, second edge = false path
        // Or use edge.data.label if available
        const trueEdge = decisionEdges.find(e => e.data?.label === 'true' || e.label === 'true') || decisionEdges[0]
        const falseEdge = decisionEdges.find(e => e.data?.label === 'false' || e.label === 'false') || decisionEdges[1]
        
        if (conditionResult && trueEdge) {
          result = await executeNode(trueEdge.target, nodes, edges, graph, context, visited, steps)
        } else if (!conditionResult && falseEdge) {
          result = await executeNode(falseEdge.target, nodes, edges, graph, context, visited, steps)
        } else {
          // Fallback: use first neighbor
          const neighbors = graph.get(nodeId) || []
          if (neighbors.length > 0) {
            result = await executeNode(neighbors[0], nodes, edges, graph, context, visited, steps)
          }
        }
        break

      case 'loop':
        // Loop node: iterate over items
        const loopType = node.data.loopType || 'for_each'
        const loopItems = node.data.items || []
        const loopResults: any[] = []
        
        if (loopType === 'for_each' && Array.isArray(loopItems)) {
          for (const item of loopItems) {
            context.variables['item'] = item
            const neighbors = graph.get(nodeId) || []
            if (neighbors.length > 0) {
              const loopResult = await executeNode(neighbors[0], nodes, edges, graph, context, visited, steps)
              loopResults.push(loopResult)
            }
          }
        }
        
        result = loopResults
        break

      case 'end':
        // End node: return final result
        result = context.results[nodeId] || { status: 'completed' }
        break

      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }

    // Store result in context
    context.results[nodeId] = result
    
    // Record step
    steps.push({
      nodeId,
      nodeType: node.type || 'unknown',
      result,
    })

    // Continue to next nodes if not end node
    if (node.type !== 'end') {
      const neighbors = graph.get(nodeId) || []
      for (const nextNodeId of neighbors) {
        // Skip if already visited (unless it's a loop)
        if (!visited.has(nextNodeId) || node.type === 'loop') {
          await executeNode(nextNodeId, nodes, edges, graph, context, visited, steps)
        }
      }
    }

    return result
  } catch (error: any) {
    steps.push({
      nodeId,
      nodeType: node.type || 'unknown',
      error: error.message,
    })
    throw error
  }
}

/**
 * Resolve variables in object (simple ${var} replacement)
 */
function resolveVariables(obj: any, variables: Record<string, any>): any {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{(\w+)\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match
    })
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => resolveVariables(item, variables))
  }
  
  if (obj && typeof obj === 'object') {
    const resolved: any = {}
    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = resolveVariables(value, variables)
    }
    return resolved
  }
  
  return obj
}

/**
 * Evaluate condition safely (no eval)
 * Supports: >, <, >=, <=, ===, !==, ==, !=, &&, ||
 */
function evaluateCondition(condition: string, variables: Record<string, any>): boolean {
  if (!condition || !condition.trim()) return true
  
  try {
    // Replace variables in condition
    let resolvedCondition = condition.trim()
    
    // Replace variable references with their values
    for (const [varName, varValue] of Object.entries(variables)) {
      // Match variable names (word boundaries to avoid partial matches)
      const regex = new RegExp(`\\b${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
      const valueStr = typeof varValue === 'string' ? `"${varValue.replace(/"/g, '\\"')}"` : String(varValue)
      resolvedCondition = resolvedCondition.replace(regex, valueStr)
    }
    
    // Parse and evaluate safely (no eval)
    return parseAndEvaluate(resolvedCondition)
  } catch {
    return false
  }
}

/**
 * Safe condition parser (no eval)
 */
function parseAndEvaluate(expr: string): boolean {
  // Remove whitespace
  expr = expr.replace(/\s+/g, ' ').trim()
  
  // Handle logical operators (&&, ||)
  if (expr.includes('||')) {
    const parts = expr.split('||').map(p => p.trim())
    return parts.some(part => parseAndEvaluate(part))
  }
  
  if (expr.includes('&&')) {
    const parts = expr.split('&&').map(p => p.trim())
    return parts.every(part => parseAndEvaluate(part))
  }
  
  // Handle comparison operators
  const operators = [
    { op: '>=', fn: (a: number, b: number) => a >= b },
    { op: '<=', fn: (a: number, b: number) => a <= b },
    { op: '===', fn: (a: any, b: any) => a === b },
    { op: '!==', fn: (a: any, b: any) => a !== b },
    { op: '==', fn: (a: any, b: any) => a == b },
    { op: '!=', fn: (a: any, b: any) => a != b },
    { op: '>', fn: (a: number, b: number) => a > b },
    { op: '<', fn: (a: number, b: number) => a < b },
  ]
  
  for (const { op, fn } of operators) {
    if (expr.includes(op)) {
      const [left, right] = expr.split(op).map(s => s.trim())
      const leftVal = parseValue(left)
      const rightVal = parseValue(right)
      return fn(leftVal, rightVal)
    }
  }
  
  // If no operator found, treat as boolean
  return parseValue(expr) === true || parseValue(expr) === 'true'
}

/**
 * Parse a value (number, string, boolean)
 */
function parseValue(str: string): any {
  str = str.trim()
  
  // Remove quotes from strings
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1)
  }
  
  // Parse numbers
  if (/^-?\d+\.?\d*$/.test(str)) {
    return parseFloat(str)
  }
  
  // Parse booleans
  if (str === 'true') return true
  if (str === 'false') return false
  
  // Return as string
  return str
}

