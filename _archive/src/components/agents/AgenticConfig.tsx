"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Info } from "lucide-react"
import type { AgenticConfig } from "@/domain/entities/agent.entity"
import { financeTools, salesTools, hrTools, crossCollectionTools, advancedTools } from "@/lib/powerful-tools"

interface AgenticConfigProps {
  config: Partial<AgenticConfig> | undefined
  onConfigChange: (config: Partial<AgenticConfig>) => void
  selectedCollections: string[]
}

export function AgenticConfigForm({ config, onConfigChange, selectedCollections }: AgenticConfigProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['reasoning', 'tools']))

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const updateConfig = (path: string[], value: any) => {
    const newConfig = { ...config }
    let current: any = newConfig
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {}
      }
      current = current[path[i]]
    }
    
    current[path[path.length - 1]] = value
    onConfigChange(newConfig)
  }

  const getValue = (path: string[], defaultValue: any = undefined) => {
    let current: any = config
    for (const key of path) {
      if (current?.[key] === undefined) return defaultValue
      current = current[key]
    }
    return current ?? defaultValue
  }

  // Extract tool names from tool definitions
  const financeToolNames = financeTools.map(t => t.function.name)
  const salesToolNames = salesTools.map(t => t.function.name)
  const hrToolNames = hrTools.map(t => t.function.name)
  const crossCollectionToolNames = crossCollectionTools.map(t => t.function.name)
  const advancedToolNames = advancedTools.map(t => t.function.name)

  const hasFinance = selectedCollections.some(c => c.includes('finance'))
  const hasSales = selectedCollections.some(c => c.includes('sales'))
  const hasHR = selectedCollections.some(c => c.includes('hr'))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-foreground/60">
        <Info className="w-4 h-4" />
        <span>Configure how your agent thinks, reasons, and responds. These settings enable true agentic AI behavior.</span>
      </div>

      {/* Reasoning & Planning */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('reasoning')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reasoning & Planning</CardTitle>
              <CardDescription>Control how the agent thinks through problems</CardDescription>
            </div>
            <Switch
              checked={getValue(['reasoning', 'enabled'], true)}
              onCheckedChange={(checked) => updateConfig(['reasoning', 'enabled'], checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </CardHeader>
        {expandedSections.has('reasoning') && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Reasoning Depth</Label>
              <Select
                value={getValue(['reasoning', 'depth'], 'moderate')}
                onValueChange={(value) => updateConfig(['reasoning', 'depth'], value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shallow">Shallow - Quick, simple reasoning</SelectItem>
                  <SelectItem value="moderate">Moderate - Balanced depth and speed</SelectItem>
                  <SelectItem value="deep">Deep - Thorough, multi-step analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Maximum Reasoning Steps</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={getValue(['reasoning', 'maxSteps'], 5)}
                onChange={(e) => updateConfig(['reasoning', 'maxSteps'], parseInt(e.target.value) || 5)}
              />
              <p className="text-xs text-foreground/60">How many steps the agent can plan ahead (1-10)</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Reasoning Steps</Label>
                <p className="text-xs text-foreground/60">Display the agent's thinking process to users</p>
              </div>
              <Switch
                checked={getValue(['reasoning', 'showReasoning'], true)}
                onCheckedChange={(checked) => updateConfig(['reasoning', 'showReasoning'], checked)}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tool Selection */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('tools')}
        >
          <CardTitle>Tool Selection</CardTitle>
          <CardDescription>Choose which tools and capabilities your agent can use</CardDescription>
        </CardHeader>
        {expandedSections.has('tools') && (
          <CardContent className="space-y-6">
            {/* Basic Tools */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Basic Tools</Label>
              <div className="space-y-2 pl-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Query Collection</Label>
                  <Switch
                    checked={getValue(['tools', 'basic', 'queryCollection'], true)}
                    onCheckedChange={(checked) => updateConfig(['tools', 'basic', 'queryCollection'], checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Analyze Data</Label>
                  <Switch
                    checked={getValue(['tools', 'basic', 'analyzeData'], true)}
                    onCheckedChange={(checked) => updateConfig(['tools', 'basic', 'analyzeData'], checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Get Collection Schema</Label>
                  <Switch
                    checked={getValue(['tools', 'basic', 'getCollectionSchema'], true)}
                    onCheckedChange={(checked) => updateConfig(['tools', 'basic', 'getCollectionSchema'], checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Powerful Tools */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Powerful Tools</Label>
              
              {hasFinance && (
                <div className="space-y-2 pl-4">
                  <Label className="text-sm font-medium">Finance Tools</Label>
                  <div className="space-y-2 pl-4">
                    {financeToolNames.map(toolName => (
                      <div key={toolName} className="flex items-center space-x-2">
                        <Checkbox
                          id={`finance-${toolName}`}
                          checked={getValue(['tools', 'powerful', 'finance'], []).includes(toolName)}
                          onCheckedChange={(checked) => {
                            const current = getValue(['tools', 'powerful', 'finance'], [])
                            const updated = checked
                              ? [...current, toolName]
                              : current.filter((t: string) => t !== toolName)
                            updateConfig(['tools', 'powerful', 'finance'], updated)
                          }}
                        />
                        <Label htmlFor={`finance-${toolName}`} className="text-sm font-normal cursor-pointer">
                          {toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasSales && (
                <div className="space-y-2 pl-4">
                  <Label className="text-sm font-medium">Sales Tools</Label>
                  <div className="space-y-2 pl-4">
                    {salesToolNames.map(toolName => (
                      <div key={toolName} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sales-${toolName}`}
                          checked={getValue(['tools', 'powerful', 'sales'], []).includes(toolName)}
                          onCheckedChange={(checked) => {
                            const current = getValue(['tools', 'powerful', 'sales'], [])
                            const updated = checked
                              ? [...current, toolName]
                              : current.filter((t: string) => t !== toolName)
                            updateConfig(['tools', 'powerful', 'sales'], updated)
                          }}
                        />
                        <Label htmlFor={`sales-${toolName}`} className="text-sm font-normal cursor-pointer">
                          {toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasHR && (
                <div className="space-y-2 pl-4">
                  <Label className="text-sm font-medium">HR Tools</Label>
                  <div className="space-y-2 pl-4">
                    {hrToolNames.map(toolName => (
                      <div key={toolName} className="flex items-center space-x-2">
                        <Checkbox
                          id={`hr-${toolName}`}
                          checked={getValue(['tools', 'powerful', 'hr'], []).includes(toolName)}
                          onCheckedChange={(checked) => {
                            const current = getValue(['tools', 'powerful', 'hr'], [])
                            const updated = checked
                              ? [...current, toolName]
                              : current.filter((t: string) => t !== toolName)
                            updateConfig(['tools', 'powerful', 'hr'], updated)
                          }}
                        />
                        <Label htmlFor={`hr-${toolName}`} className="text-sm font-normal cursor-pointer">
                          {toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pl-4">
                <Label className="text-sm font-medium">Cross-Collection Tools</Label>
                <div className="space-y-2 pl-4">
                  {crossCollectionToolNames.map(toolName => (
                    <div key={toolName} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cross-${toolName}`}
                        checked={getValue(['tools', 'powerful', 'crossCollection'], []).includes(toolName)}
                        onCheckedChange={(checked) => {
                          const current = getValue(['tools', 'powerful', 'crossCollection'], [])
                          const updated = checked
                            ? [...current, toolName]
                            : current.filter((t: string) => t !== toolName)
                          updateConfig(['tools', 'powerful', 'crossCollection'], updated)
                        }}
                      />
                      <Label htmlFor={`cross-${toolName}`} className="text-sm font-normal cursor-pointer">
                        {toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pl-4">
                <Label className="text-sm font-medium">Advanced Tools</Label>
                <div className="space-y-2 pl-4">
                  {advancedToolNames.map(toolName => (
                    <div key={toolName} className="flex items-center space-x-2">
                      <Checkbox
                        id={`advanced-${toolName}`}
                        checked={getValue(['tools', 'powerful', 'advanced'], []).includes(toolName)}
                        onCheckedChange={(checked) => {
                          const current = getValue(['tools', 'powerful', 'advanced'], [])
                          const updated = checked
                            ? [...current, toolName]
                            : current.filter((t: string) => t !== toolName)
                          updateConfig(['tools', 'powerful', 'advanced'], updated)
                        }}
                      />
                      <Label htmlFor={`advanced-${toolName}`} className="text-sm font-normal cursor-pointer">
                        {toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Proactive Insights */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('proactive')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Proactive Insights</CardTitle>
              <CardDescription>Enable the agent to provide insights without being asked</CardDescription>
            </div>
            <Switch
              checked={getValue(['proactiveInsights', 'enabled'], true)}
              onCheckedChange={(checked) => updateConfig(['proactiveInsights', 'enabled'], checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </CardHeader>
        {expandedSections.has('proactive') && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Insight Frequency</Label>
              <Select
                value={getValue(['proactiveInsights', 'frequency'], 'sometimes')}
                onValueChange={(value) => updateConfig(['proactiveInsights', 'frequency'], value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Always - Show insights whenever relevant</SelectItem>
                  <SelectItem value="sometimes">Sometimes - Show insights when significant</SelectItem>
                  <SelectItem value="rarely">Rarely - Only show critical insights</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Anomaly Detection</Label>
                  <p className="text-xs text-foreground/60">Detect unusual patterns automatically</p>
                </div>
                <Switch
                  checked={getValue(['proactiveInsights', 'anomalyDetection'], true)}
                  onCheckedChange={(checked) => updateConfig(['proactiveInsights', 'anomalyDetection'], checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Trend Identification</Label>
                  <p className="text-xs text-foreground/60">Identify trends automatically</p>
                </div>
                <Switch
                  checked={getValue(['proactiveInsights', 'trendIdentification'], true)}
                  onCheckedChange={(checked) => updateConfig(['proactiveInsights', 'trendIdentification'], checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Follow-up Questions</Label>
                  <p className="text-xs text-foreground/60">Generate relevant follow-up questions</p>
                </div>
                <Switch
                  checked={getValue(['proactiveInsights', 'followUpQuestions'], true)}
                  onCheckedChange={(checked) => updateConfig(['proactiveInsights', 'followUpQuestions'], checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Recommendations</Label>
                  <p className="text-xs text-foreground/60">Provide actionable recommendations</p>
                </div>
                <Switch
                  checked={getValue(['proactiveInsights', 'recommendations'], true)}
                  onCheckedChange={(checked) => updateConfig(['proactiveInsights', 'recommendations'], checked)}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Context Memory */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('memory')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Context Memory</CardTitle>
              <CardDescription>Enable the agent to remember and learn from conversations</CardDescription>
            </div>
            <Switch
              checked={getValue(['contextMemory', 'enabled'], true)}
              onCheckedChange={(checked) => updateConfig(['contextMemory', 'enabled'], checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </CardHeader>
        {expandedSections.has('memory') && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Context Window</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={getValue(['contextMemory', 'contextWindow'], 10)}
                onChange={(e) => updateConfig(['contextMemory', 'contextWindow'], parseInt(e.target.value) || 10)}
              />
              <p className="text-xs text-foreground/60">Number of previous messages to remember (1-50)</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Conversation History</Label>
                  <p className="text-xs text-foreground/60">Remember conversation context</p>
                </div>
                <Switch
                  checked={getValue(['contextMemory', 'conversationHistory'], true)}
                  onCheckedChange={(checked) => updateConfig(['contextMemory', 'conversationHistory'], checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>User Preferences</Label>
                  <p className="text-xs text-foreground/60">Learn user's typical questions</p>
                </div>
                <Switch
                  checked={getValue(['contextMemory', 'userPreferences'], true)}
                  onCheckedChange={(checked) => updateConfig(['contextMemory', 'userPreferences'], checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pattern Learning</Label>
                  <p className="text-xs text-foreground/60">Learn from conversation patterns</p>
                </div>
                <Switch
                  checked={getValue(['contextMemory', 'patternLearning'], true)}
                  onCheckedChange={(checked) => updateConfig(['contextMemory', 'patternLearning'], checked)}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Response Style */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('response')}
        >
          <CardTitle>Response Style</CardTitle>
          <CardDescription>Customize how the agent communicates</CardDescription>
        </CardHeader>
        {expandedSections.has('response') && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select
                value={getValue(['responseStyle', 'tone'], 'conversational')}
                onValueChange={(value) => updateConfig(['responseStyle', 'tone'], value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Detail Level</Label>
              <Select
                value={getValue(['responseStyle', 'detailLevel'], 'moderate')}
                onValueChange={(value) => updateConfig(['responseStyle', 'detailLevel'], value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief - Concise answers</SelectItem>
                  <SelectItem value="moderate">Moderate - Balanced detail</SelectItem>
                  <SelectItem value="detailed">Detailed - Comprehensive answers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Numbers</Label>
                  <p className="text-xs text-foreground/60">Always include specific numbers</p>
                </div>
                <Switch
                  checked={getValue(['responseStyle', 'includeNumbers'], true)}
                  onCheckedChange={(checked) => updateConfig(['responseStyle', 'includeNumbers'], checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Sources</Label>
                  <p className="text-xs text-foreground/60">Show which data was used</p>
                </div>
                <Switch
                  checked={getValue(['responseStyle', 'includeSources'], false)}
                  onCheckedChange={(checked) => updateConfig(['responseStyle', 'includeSources'], checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Format Output</Label>
                  <p className="text-xs text-foreground/60">Use markdown, lists, etc.</p>
                </div>
                <Switch
                  checked={getValue(['responseStyle', 'formatOutput'], true)}
                  onCheckedChange={(checked) => updateConfig(['responseStyle', 'formatOutput'], checked)}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Domain Knowledge */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('domain')}
        >
          <CardTitle>Domain Knowledge</CardTitle>
          <CardDescription>Configure domain-specific behavior</CardDescription>
        </CardHeader>
        {expandedSections.has('domain') && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Domain</Label>
              <Select
                value={getValue(['domainKnowledge', 'domain'], 'general')}
                onValueChange={(value) => updateConfig(['domainKnowledge', 'domain'], value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Instructions</Label>
              <Textarea
                placeholder="Add domain-specific instructions, terminology, or context..."
                value={getValue(['domainKnowledge', 'customInstructions'], '')}
                onChange={(e) => updateConfig(['domainKnowledge', 'customInstructions'], e.target.value)}
                rows={4}
              />
              <p className="text-xs text-foreground/60">Optional: Add custom instructions for domain-specific behavior</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

