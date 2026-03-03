"use client"

import { useCallback, useState, useEffect } from "react"
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  NodeTypes,
} from "reactflow"
import "reactflow/dist/style.css"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Settings, Play, Database, Zap, BarChart3, GitBranch, Repeat, AlertCircle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ToolDefinition } from "@/lib/agent-tools"

interface VisualWorkflowBuilderProps {
  selectedTools: Set<string>
  onWorkflowChange?: (nodes: Node[], edges: Edge[]) => void
}

// Custom node types
const ToolNode = ({ data }: { data: any }) => {
  const getIcon = (toolName: string) => {
    if (toolName.includes("query") || toolName.includes("schema")) {
      return <Database className="w-4 h-4" />
    }
    if (toolName.includes("analyze")) {
      return <BarChart3 className="w-4 h-4" />
    }
    return <Zap className="w-4 h-4" />
  }

  return (
    <div className="px-4 py-3 bg-background border-2 border-primary rounded-lg shadow-sm min-w-[180px]">
      <div className="flex items-center gap-2 mb-1">
        <div className="text-primary">{getIcon(data.toolName)}</div>
        <div className="font-medium text-sm text-foreground">{data.label}</div>
      </div>
      <div className="text-xs text-foreground/60 mt-1">{data.description}</div>
    </div>
  )
}

const StartNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 bg-primary/10 border-2 border-primary rounded-lg shadow-sm min-w-[120px]">
      <div className="font-medium text-sm text-foreground text-center">Start</div>
    </div>
  )
}

const EndNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 bg-primary/10 border-2 border-primary rounded-lg shadow-sm min-w-[120px]">
      <div className="font-medium text-sm text-foreground text-center">End</div>
    </div>
  )
}

const DecisionNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 bg-orange-500/10 border-2 border-orange-500 rounded-lg shadow-sm min-w-[180px]">
      <div className="flex items-center gap-2 mb-1">
        <GitBranch className="w-4 h-4 text-orange-500" />
        <div className="font-medium text-sm text-foreground">Decision</div>
      </div>
      <div className="text-xs text-foreground/60 mt-1">
        {data.condition || "Set condition..."}
      </div>
      <div className="flex gap-1 mt-2">
        <Badge variant="outline" className="text-xs">True</Badge>
        <Badge variant="outline" className="text-xs">False</Badge>
      </div>
    </div>
  )
}

const LoopNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 bg-purple-500/10 border-2 border-purple-500 rounded-lg shadow-sm min-w-[180px]">
      <div className="flex items-center gap-2 mb-1">
        <Repeat className="w-4 h-4 text-purple-500" />
        <div className="font-medium text-sm text-foreground">Loop</div>
      </div>
      <div className="text-xs text-foreground/60 mt-1">
        {data.loopType || "For each..."}
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  tool: ToolNode,
  start: StartNode,
  end: EndNode,
  decision: DecisionNode,
  loop: LoopNode,
}

const initialNodes: Node[] = [
  {
    id: "start",
    type: "start",
    position: { x: 100, y: 100 },
    data: { label: "Start" },
  },
]

const initialEdges: Edge[] = []

// Workflow validation
function validateWorkflow(nodes: Node[], edges: Edge[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check for start node
  const hasStart = nodes.some(n => n.type === 'start')
  if (!hasStart) errors.push("Workflow must have a start node")
  
  // Check for end node
  const hasEnd = nodes.some(n => n.type === 'end')
  if (!hasEnd) errors.push("Workflow should have an end node")
  
  // Check for orphaned nodes (nodes with no connections)
  const connectedNodeIds = new Set<string>()
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })
  
  nodes.forEach(node => {
    if (node.type !== 'start' && node.type !== 'end' && !connectedNodeIds.has(node.id)) {
      errors.push(`Node "${node.data.label || node.id}" is not connected`)
    }
  })
  
  // Check decision nodes have both true/false paths
  nodes.forEach(node => {
    if (node.type === 'decision') {
      const outgoingEdges = edges.filter(e => e.source === node.id)
      if (outgoingEdges.length < 2) {
        errors.push(`Decision node "${node.data.label || node.id}" needs both True and False paths`)
      }
    }
  })
  
  // Check for cycles (simplified - just check if end is reachable from start)
  const startNode = nodes.find(n => n.type === 'start')
  const endNode = nodes.find(n => n.type === 'end')
  if (startNode && endNode) {
    const visited = new Set<string>()
    const queue = [startNode.id]
    visited.add(startNode.id)
    
    while (queue.length > 0) {
      const current = queue.shift()!
      if (current === endNode.id) break
      
      edges.filter(e => e.source === current).forEach(edge => {
        if (!visited.has(edge.target)) {
          visited.add(edge.target)
          queue.push(edge.target)
        }
      })
    }
    
    if (!visited.has(endNode.id) && nodes.length > 2) {
      errors.push("End node is not reachable from start node")
    }
  }
  
  return { valid: errors.length === 0, errors }
}

export function VisualWorkflowBuilder({ selectedTools, onWorkflowChange }: VisualWorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] })

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges]
  )

  const addToolNode = (toolName: string, toolDef: ToolDefinition) => {
    const newNode: Node = {
      id: `tool-${toolName}-${Date.now()}`,
      type: "tool",
      position: {
        x: Math.random() * 400 + 200,
        y: Math.random() * 300 + 150,
      },
      data: {
        label: toolName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        toolName,
        description: toolDef.function.description.substring(0, 60) + "...",
      },
    }

    setNodes((nds) => [...nds, newNode])
  }

  const addDecisionNode = () => {
    const newNode: Node = {
      id: `decision-${Date.now()}`,
      type: "decision",
      position: {
        x: Math.random() * 400 + 200,
        y: Math.random() * 300 + 150,
      },
      data: {
        label: "Decision",
        condition: "",
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const addLoopNode = () => {
    const newNode: Node = {
      id: `loop-${Date.now()}`,
      type: "loop",
      position: {
        x: Math.random() * 400 + 200,
        y: Math.random() * 300 + 150,
      },
      data: {
        label: "Loop",
        loopType: "for_each",
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
  }

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // Validate workflow and notify parent
  useEffect(() => {
    const validationResult = validateWorkflow(nodes, edges)
    setValidation(validationResult)
    
    if (onWorkflowChange) {
      onWorkflowChange(nodes, edges)
    }
  }, [nodes, edges, onWorkflowChange])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Visual Workflow Builder</h3>
          <p className="text-sm text-foreground/60 mt-1">
            Drag and connect tools to build your agent's workflow. This is optional - tools can also be used automatically.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={addDecisionNode}>
            <GitBranch className="w-4 h-4 mr-2" />
            Decision
          </Button>
          <Button variant="outline" size="sm" onClick={addLoopNode}>
            <Repeat className="w-4 h-4 mr-2" />
            Loop
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const endNode: Node = {
              id: `end-${Date.now()}`,
              type: "end",
              position: { x: 600, y: 100 },
              data: { label: "End" },
            }
            setNodes((nds) => [...nds, endNode])
          }}>
            <Plus className="w-4 h-4 mr-2" />
            End
          </Button>
          {validation.valid ? (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Valid
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Available Tools</CardTitle>
            <CardDescription className="text-xs">
              Click to add to workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {Array.from(selectedTools).map((toolName) => {
              // Find tool definition (simplified - in real app, pass tool definitions)
              const toolDef: ToolDefinition = {
                type: "function",
                function: {
                  name: toolName,
                  description: `Tool: ${toolName}`,
                  parameters: { type: "object", properties: {} },
                },
              }

              return (
                <Button
                  key={toolName}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => addToolNode(toolName, toolDef)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {toolName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                  </div>
                </Button>
              )
            })}
            {selectedTools.size === 0 && (
              <p className="text-xs text-foreground/60 text-center py-4">
                Select tools from the marketplace first
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">Workflow Canvas</CardTitle>
            <CardDescription className="text-xs">
              Connect tools by dragging from one node to another
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] border border-border rounded-lg bg-muted/20">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
              >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              </ReactFlow>
            </div>
          </CardContent>
        </Card>
      </div>

      {validation.errors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Workflow Validation Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, idx) => (
                <li key={idx} className="text-sm text-destructive">{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {selectedNode && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Node Settings</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  deleteNode(selectedNode.id)
                  setSelectedNode(null)
                }}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedNode.type === "tool" && (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-foreground/60">Tool Name</label>
                  <p className="text-sm font-medium">{selectedNode.data.toolName}</p>
                </div>
                <div>
                  <label className="text-xs text-foreground/60">Description</label>
                  <p className="text-sm">{selectedNode.data.description}</p>
                </div>
              </div>
            )}
            
            {selectedNode.type === "decision" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Input
                    value={selectedNode.data.condition || ""}
                    onChange={(e) => {
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, condition: e.target.value } }
                            : n
                        )
                      )
                    }}
                    placeholder="e.g., amount > 1000"
                  />
                  <p className="text-xs text-foreground/60">
                    Define the condition for branching (e.g., &quot;value &gt; 100&quot;, &quot;status === &apos;active&apos;&quot;)
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-foreground/60 mb-2">Connect two edges:</p>
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs">True path (left/up)</Badge>
                    <Badge variant="outline" className="text-xs">False path (right/down)</Badge>
                  </div>
                </div>
              </div>
            )}
            
            {selectedNode.type === "loop" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Loop Type</Label>
                  <Select
                    value={selectedNode.data.loopType || "for_each"}
                    onValueChange={(value) => {
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, loopType: value } }
                            : n
                        )
                      )
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="for_each">For Each (iterate over items)</SelectItem>
                      <SelectItem value="while">While (condition-based)</SelectItem>
                      <SelectItem value="for_range">For Range (numeric range)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-foreground/60">
                    Loop nodes execute their connected nodes repeatedly until the condition is met or items are exhausted.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

