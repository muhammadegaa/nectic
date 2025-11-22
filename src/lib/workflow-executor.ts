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
          context.userId
        )
        break

      case 'decision':
        // Decision node: evaluate condition and choose path
        const condition = node.data.condition || ''
        const conditionResult = evaluateCondition(condition, context.variables)
        
        // Find edges from this node
        const neighbors = graph.get(nodeId) || []
        const trueEdge = edges.find(e => e.source === nodeId && e.label === 'true')
        const falseEdge = edges.find(e => e.source === nodeId && e.label === 'false')
        
        if (conditionResult && trueEdge) {
          result = await executeNode(trueEdge.target, nodes, edges, graph, context, visited, steps)
        } else if (!conditionResult && falseEdge) {
          result = await executeNode(falseEdge.target, nodes, edges, graph, context, visited, steps)
        } else {
          // No matching edge, use first neighbor
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
      nodeType: node.type,
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
      nodeType: node.type,
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
 * Evaluate condition (simple JavaScript-like evaluation)
 * For MVP: supports basic comparisons
 */
function evaluateCondition(condition: string, variables: Record<string, any>): boolean {
  if (!condition) return true
  
  try {
    // Replace variables in condition
    let resolvedCondition = condition
    for (const [varName, varValue] of Object.entries(variables)) {
      const regex = new RegExp(`\\b${varName}\\b`, 'g')
      resolvedCondition = resolvedCondition.replace(regex, JSON.stringify(varValue))
    }
    
    // Simple evaluation (for MVP - in production, use a safe evaluator)
    // Only allow basic comparisons for security
    if (/^[^(){}[\]]+$/.test(resolvedCondition)) {
      // eslint-disable-next-line no-eval
      return eval(resolvedCondition)
    }
    
    return false
  } catch {
    return false
  }
}

