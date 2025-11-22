"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Brain, 
  MessageSquare, 
  Database, 
  Zap, 
  Settings, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Copy,
  Check,
  Info,
  TrendingUp
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface AgentConfigurationProps {
  config: {
    model?: {
      provider: string
      model: string
      apiKey?: string
      temperature?: number
      maxTokens?: number
    }
    systemPrompt?: string
    memory?: {
      type: 'session' | 'persistent' | 'episodic'
      maxTurns?: number
      enableLearning?: boolean
    }
    deployment?: {
      channels: string[]
      webhookUrl?: string
    }
  }
  onConfigChange: (config: any) => void
}

const MODEL_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'] },
  { id: 'google', name: 'Google', models: ['gemini-pro', 'gemini-pro-vision'] },
  { id: 'custom', name: 'Custom API', models: [] },
]

const PROMPT_TEMPLATES = [
  {
    name: 'Data Analyst',
    description: 'Expert data analyst that analyzes enterprise data with precision, provides actionable insights, and identifies trends and opportunities.',
    prompt: `You are an expert data analyst AI agent. Your role is to:
- Analyze enterprise data with precision and clarity
- Provide actionable insights based on data patterns
- Use specific numbers and metrics in your responses
- Identify trends, anomalies, and opportunities
- Ask clarifying questions when data is ambiguous

Always show your reasoning process and cite specific data points.`
  },
  {
    name: 'Business Advisor',
    description: 'Strategic business advisor that provides insights based on business data, connects data to outcomes, and recommends actionable next steps.',
    prompt: `You are a strategic business advisor AI agent. Your role is to:
- Provide strategic insights based on business data
- Connect data points to business outcomes
- Recommend actionable next steps
- Identify risks and opportunities
- Think like a C-level executive

Be concise, data-driven, and focus on business impact.`
  },
  {
    name: 'Finance Specialist',
    description: 'Finance specialist that analyzes financial data accurately, calculates budgets and forecasts, and identifies cost optimization opportunities.',
    prompt: `You are a finance specialist AI agent. Your role is to:
- Analyze financial data with accuracy
- Calculate budgets, forecasts, and variances
- Identify cost optimization opportunities
- Provide financial health assessments
- Explain financial metrics in business terms

Always use specific numbers, percentages, and timeframes.`
  },
  {
    name: 'Sales Analyst',
    description: 'Sales analyst that analyzes sales pipeline and performance, identifies conversion opportunities, and forecasts revenue accurately.',
    prompt: `You are a sales analyst AI agent. Your role is to:
- Analyze sales pipeline and performance
- Identify conversion opportunities
- Forecast revenue accurately
- Highlight at-risk deals
- Provide sales strategy recommendations

Focus on actionable insights that drive revenue.`
  },
  {
    name: 'HR Assistant',
    description: 'HR assistant that analyzes team capacity and performance, identifies hiring needs and retention risks, and provides workforce insights.',
    prompt: `You are an HR assistant AI agent. Your role is to:
- Analyze team capacity and performance
- Identify hiring needs and retention risks
- Provide workforce insights
- Support talent management decisions
- Maintain confidentiality and professionalism

Be empathetic, data-driven, and focused on people outcomes.`
  },
  {
    name: 'Custom',
    description: 'Create your own custom prompt tailored to your specific needs and use case.',
    prompt: ''
  }
]

const MEMORY_TYPES = [
  { 
    id: 'session', 
    name: 'Session Memory', 
    description: 'Remembers context within a single conversation session',
    icon: MessageSquare
  },
  { 
    id: 'persistent', 
    name: 'Persistent Memory', 
    description: 'Remembers context across all conversations with this user',
    icon: Database
  },
  { 
    id: 'episodic', 
    name: 'Episodic Memory', 
    description: 'Remembers key events and patterns across all users',
    icon: Brain
  }
]

const DEPLOYMENT_CHANNELS = [
  { id: 'web', name: 'Web Interface', description: 'Deploy as a web chat interface' },
  { id: 'slack', name: 'Slack', description: 'Deploy as a Slack bot via OAuth integration' },
  { id: 'api', name: 'API', description: 'Deploy as REST API endpoint' },
  { id: 'webhook', name: 'Webhook', description: 'Trigger via webhook endpoint' },
]

export function AgentConfiguration({ config, onConfigChange }: AgentConfigurationProps) {
  const { toast } = useToast()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['model', 'prompt']))
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null)

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

  const applyTemplate = (template: typeof PROMPT_TEMPLATES[0]) => {
    if (template.name === 'Custom') return
    updateConfig(['systemPrompt'], template.prompt)
    toast({
      title: "Template Applied",
      description: `${template.name} template has been applied`,
    })
  }

  const copyPrompt = () => {
    const prompt = getValue(['systemPrompt'], '')
    navigator.clipboard.writeText(prompt)
    setCopiedTemplate('prompt')
    setTimeout(() => setCopiedTemplate(null), 2000)
    toast({
      title: "Copied",
      description: "System prompt copied to clipboard",
    })
  }

  const selectedProvider = MODEL_PROVIDERS.find(p => p.id === getValue(['model', 'provider'], 'openai'))
  const selectedModel = getValue(['model', 'model'], 'gpt-4')

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('model')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>AI Model Configuration</CardTitle>
                <CardDescription>Select the AI model and provider for your agent</CardDescription>
              </div>
            </div>
            {expandedSections.has('model') ? (
              <ChevronUp className="w-5 h-5 text-foreground/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-foreground/60" />
            )}
          </div>
        </CardHeader>
        {expandedSections.has('model') && (
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={getValue(['model', 'provider'], 'openai')}
                  onValueChange={(value) => {
                    updateConfig(['model', 'provider'], value)
                    const provider = MODEL_PROVIDERS.find(p => p.id === value)
                    if (provider && provider.models.length > 0) {
                      updateConfig(['model', 'model'], provider.models[0])
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_PROVIDERS.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Select
                  value={selectedModel}
                  onValueChange={(value) => updateConfig(['model', 'model'], value)}
                  disabled={!selectedProvider || selectedProvider.models.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProvider?.models.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {getValue(['model', 'provider'], 'openai') === 'custom' && (
              <div className="space-y-2">
                <Label>API Endpoint</Label>
                <Input
                  placeholder="https://api.example.com/v1/chat/completions"
                  value={getValue(['model', 'apiEndpoint'], '')}
                  onChange={(e) => updateConfig(['model', 'apiEndpoint'], e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Temperature</Label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={getValue(['model', 'temperature'], 0.7)}
                    onChange={(e) => updateConfig(['model', 'temperature'], parseFloat(e.target.value) || 0.7)}
                  />
                  <p className="text-xs text-foreground/60">
                    Lower = more focused, Higher = more creative (0-2)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  min="100"
                  max="8000"
                  value={getValue(['model', 'maxTokens'], 2000)}
                  onChange={(e) => updateConfig(['model', 'maxTokens'], parseInt(e.target.value) || 2000)}
                />
                <p className="text-xs text-foreground/60">
                  Maximum response length (100-8000)
                </p>
              </div>
            </div>

            {getValue(['model', 'provider'], 'openai') !== 'custom' && (
              <div className="p-3 bg-muted rounded-lg border border-border">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-foreground/60 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground/80">
                      API keys are securely stored and encrypted. You can use your own API key or use our managed keys.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* System Prompt */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('prompt')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>System Prompt</CardTitle>
                <CardDescription>Define your agent's personality, behavior, and instructions</CardDescription>
              </div>
            </div>
            {expandedSections.has('prompt') ? (
              <ChevronUp className="w-5 h-5 text-foreground/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-foreground/60" />
            )}
          </div>
        </CardHeader>
        {expandedSections.has('prompt') && (
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Prompt Templates</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyPrompt}
                  className="h-8"
                >
                  {copiedTemplate === 'prompt' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PROMPT_TEMPLATES.map(template => (
                  <button
                    key={template.name}
                    onClick={() => applyTemplate(template)}
                    className="group relative h-auto min-h-[120px] p-4 rounded-lg border border-border bg-card hover:bg-accent/60 hover:border-primary/40 transition-all duration-200 flex flex-col items-start text-left cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <span className="font-semibold text-sm text-foreground mb-2.5 group-hover:text-foreground">
                      {template.name}
                    </span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground/90 leading-relaxed">
                      {template.description}
                      </span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Custom System Prompt</Label>
              <Textarea
                rows={12}
                value={getValue(['systemPrompt'], '')}
                onChange={(e) => updateConfig(['systemPrompt'], e.target.value)}
                placeholder="Enter your custom system prompt here. This defines how your agent behaves, thinks, and responds..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-foreground/60">
                {getValue(['systemPrompt'], '').length} characters
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Memory Configuration */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('memory')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>Memory Configuration</CardTitle>
                <CardDescription>Configure how your agent remembers context</CardDescription>
              </div>
            </div>
            {expandedSections.has('memory') ? (
              <ChevronUp className="w-5 h-5 text-foreground/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-foreground/60" />
            )}
          </div>
        </CardHeader>
        {expandedSections.has('memory') && (
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MEMORY_TYPES.map(type => {
                const Icon = type.icon
                const isSelected = getValue(['memory', 'type'], 'session') === type.id
                return (
                  <div
                    key={type.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => updateConfig(['memory', 'type'], type.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-foreground/60'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{type.name}</h4>
                          {isSelected && (
                            <Badge variant="default" className="text-xs">Active</Badge>
                          )}
                        </div>
                        <p className="text-xs text-foreground/60">{type.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Conversation Turns</Label>
                <Input
                  type="number"
                  min="5"
                  max="100"
                  value={getValue(['memory', 'maxTurns'], 20)}
                  onChange={(e) => updateConfig(['memory', 'maxTurns'], parseInt(e.target.value) || 20)}
                />
                <p className="text-xs text-foreground/60">
                  How many conversation turns to remember (5-100)
                </p>
              </div>

              <div className="flex items-center justify-between pt-6">
                <div className="space-y-0.5">
                  <Label>Enable Learning</Label>
                  <p className="text-xs text-foreground/60">
                    Agent learns from past interactions
                  </p>
                </div>
                <Switch
                  checked={getValue(['memory', 'enableLearning'], false)}
                  onCheckedChange={(checked) => updateConfig(['memory', 'enableLearning'], checked)}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Cost Optimization */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('cost')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>Cost Optimization</CardTitle>
                <CardDescription>Smart Engage - Reduce LLM costs by up to 80%</CardDescription>
              </div>
            </div>
            {expandedSections.has('cost') ? (
              <ChevronUp className="w-5 h-5 text-foreground/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-foreground/60" />
            )}
          </div>
        </CardHeader>
        {expandedSections.has('cost') && (
          <CardContent className="space-y-4 pt-4">
            <div className="p-3 bg-muted rounded-lg border border-border">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-foreground/60 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/80 mb-2">
                    <strong>Smart Engage</strong> pre-screens messages with lightweight models to reduce costs by up to 80%.
                  </p>
                  <p className="text-xs text-foreground/60">
                    Simple greetings, off-topic messages, and basic queries are handled without expensive LLM calls.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Cost Optimization</Label>
                <p className="text-xs text-foreground/60">
                  Pre-screen messages to reduce LLM costs
                </p>
              </div>
              <Switch
                checked={getValue(['costOptimization', 'enabled'], true)}
                onCheckedChange={(checked) => updateConfig(['costOptimization', 'enabled'], checked)}
              />
            </div>

            {getValue(['costOptimization', 'enabled'], true) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Filter Simple Greetings</Label>
                      <p className="text-xs text-foreground/60">
                        Use template responses for greetings
                      </p>
                    </div>
                    <Switch
                      checked={getValue(['costOptimization', 'filterGreetings'], true)}
                      onCheckedChange={(checked) => updateConfig(['costOptimization', 'filterGreetings'], checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Filter Off-Topic Messages</Label>
                      <p className="text-xs text-foreground/60">
                        Reject messages not related to your data
                      </p>
                    </div>
                    <Switch
                      checked={getValue(['costOptimization', 'filterOffTopic'], true)}
                      onCheckedChange={(checked) => updateConfig(['costOptimization', 'filterOffTopic'], checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Use Lightweight Pre-Screening</Label>
                      <p className="text-xs text-foreground/60">
                        Use gpt-3.5-turbo for pre-screening (cheaper)
                      </p>
                    </div>
                    <Switch
                      checked={getValue(['costOptimization', 'useLightweightModel'], true)}
                      onCheckedChange={(checked) => updateConfig(['costOptimization', 'useLightweightModel'], checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Target Cost Savings</Label>
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={getValue(['costOptimization', 'targetSavings'], 80)}
                        onChange={(e) => updateConfig(['costOptimization', 'targetSavings'], parseInt(e.target.value) || 80)}
                      />
                      <p className="text-xs text-foreground/60">
                        Target percentage of cost reduction (0-100%). Smart Engage typically achieves 60-80% savings.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Deployment Channels */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('deployment')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>Deployment Channels</CardTitle>
                <CardDescription>Select where your agent will be available</CardDescription>
              </div>
            </div>
            {expandedSections.has('deployment') ? (
              <ChevronUp className="w-5 h-5 text-foreground/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-foreground/60" />
            )}
          </div>
        </CardHeader>
        {expandedSections.has('deployment') && (
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEPLOYMENT_CHANNELS.map(channel => {
                const isSelected = getValue(['deployment', 'channels'], ['web']).includes(channel.id)
                return (
                  <div
                    key={channel.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      const currentChannels = getValue(['deployment', 'channels'], ['web'])
                      const newChannels = isSelected
                        ? currentChannels.filter((c: string) => c !== channel.id)
                        : [...currentChannels, channel.id]
                      updateConfig(['deployment', 'channels'], newChannels)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{channel.name}</h4>
                          {isSelected && (
                            <Badge variant="default" className="text-xs">Enabled</Badge>
                          )}
                        </div>
                        <p className="text-xs text-foreground/60">{channel.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {getValue(['deployment', 'channels'], ['web']).includes('webhook') && (
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://your-app.com/webhook"
                  value={getValue(['deployment', 'webhookUrl'], '')}
                  onChange={(e) => updateConfig(['deployment', 'webhookUrl'], e.target.value)}
                />
                <p className="text-xs text-foreground/60">
                  Your agent will be triggered via POST requests to this URL
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

