/**
 * Agent Entity
 * Represents an AI agent configuration with full agentic AI capabilities
 */

import type { DatabaseConnection } from '@/lib/db-adapters/base-adapter'
import type { AllowedCollectionConfig } from '@/domain/firestore'

export interface Agent {
  id: string
  name: string
  description?: string
  collections: string[] // e.g., ['finance_transactions', 'sales_deals'] or table/collection names
  intentMappings: IntentMapping[] // Intent keywords → collections (legacy, kept for backward compatibility)
  userId: string // User who owns this agent
  // Firestore access configuration (optional - if not provided, derived from collections)
  firestoreAccess?: {
    collections: AllowedCollectionConfig[]
  }
  // Allowed tools (optional - if not provided, all tools allowed)
  allowedTools?: string[] // e.g., ['query_collection', 'analyze_data', 'powerful_budget_vs_actual']
  // Database connection (optional - if not provided, uses Firestore)
  databaseConnection?: DatabaseConnection
  // Agentic AI Configuration
  agenticConfig?: AgenticConfig
  // Model & Runtime Configuration
  modelConfig?: {
    provider: 'openai' | 'anthropic' | 'google' | 'custom'
    model: string
    apiKey?: string // Optional custom API key
    temperature?: number
    maxTokens?: number
  }
  // Memory Configuration
  memoryConfig?: {
    type: 'session' | 'persistent' | 'episodic'
    maxTurns?: number
    enableLearning?: boolean
  }
  // System Prompt (custom)
  systemPrompt?: string
  // Deployment Configuration
  deploymentConfig?: {
    channels: string[]
    webhookUrl?: string
  }
  // Workflow Configuration (visual workflow)
  workflowConfig?: {
    nodes: any[]
    edges: any[]
  }
  createdAt: string
  updatedAt: string
}

export interface IntentMapping {
  intent: string // e.g., 'revenue', 'sales', 'employees'
  keywords: string[] // e.g., ['revenue', 'income', 'money', 'earnings']
  collections: string[] // e.g., ['finance_transactions']
}

/**
 * Agentic AI Configuration
 * Controls how the agent thinks, reasons, and responds
 */
export interface AgenticConfig {
  // Reasoning & Planning
  reasoning: {
    enabled: boolean // Enable multi-step reasoning
    depth: 'shallow' | 'moderate' | 'deep' // How many steps to plan ahead
    showReasoning: boolean // Show reasoning steps to user
    maxSteps: number // Maximum reasoning steps (1-10)
  }
  
  // Tool Selection
  tools: {
    basic: {
      queryCollection: boolean
      analyzeData: boolean
      getCollectionSchema: boolean
    }
    powerful: {
      finance: string[] // e.g., ['budget_vs_actual', 'cash_flow_forecast']
      sales: string[] // e.g., ['pipeline_health', 'sales_forecast']
      hr: string[] // e.g., ['team_capacity_analysis', 'retention_risk_analysis']
      crossCollection: string[] // e.g., ['correlate_finance_sales']
      advanced: string[] // e.g., ['trend_forecasting', 'what_if_scenario']
    }
  }
  
  // Proactive Insights
  proactiveInsights: {
    enabled: boolean
    anomalyDetection: boolean // Detect unusual patterns
    trendIdentification: boolean // Identify trends automatically
    followUpQuestions: boolean // Generate follow-up questions
    recommendations: boolean // Provide actionable recommendations
    frequency: 'always' | 'sometimes' | 'rarely' // How often to show insights
  }
  
  // Context Memory
  contextMemory: {
    enabled: boolean
    conversationHistory: boolean // Remember conversation context
    userPreferences: boolean // Learn user's typical questions
    patternLearning: boolean // Learn from conversation patterns
    contextWindow: number // Number of previous messages to remember (1-50)
  }
  
  // Response Style
  responseStyle: {
    tone: 'professional' | 'conversational' | 'technical' | 'friendly'
    detailLevel: 'brief' | 'moderate' | 'detailed'
    includeNumbers: boolean // Always include specific numbers
    includeSources: boolean // Show which data was used
    formatOutput: boolean // Format with markdown, lists, etc.
  }
  
  // Domain-Specific Knowledge
  domainKnowledge?: {
    domain: 'finance' | 'sales' | 'hr' | 'general' | 'custom'
    customInstructions?: string // Custom domain-specific instructions
    terminology?: Record<string, string> // Custom terminology mapping
  }
  
  // Cost Optimization (Smart Engage)
  costOptimization?: {
    enabled: boolean // Enable Smart Engage pre-screening
    filterGreetings: boolean // Filter simple greetings
    filterOffTopic: boolean // Filter off-topic messages
    useLightweightModel: boolean // Use gpt-3.5-turbo for pre-screening
    targetSavings: number // Target cost savings percentage (0-100)
  }
}




