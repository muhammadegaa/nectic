/**
 * Agent Entity
 * Represents an AI agent configuration
 */

export interface Agent {
  id: string
  name: string
  description?: string
  collections: string[] // e.g., ['finance_transactions', 'sales_deals']
  intentMappings: IntentMapping[] // Intent keywords → collections
  createdAt: string
  updatedAt: string
}

export interface IntentMapping {
  intent: string // e.g., 'revenue', 'sales', 'employees'
  keywords: string[] // e.g., ['revenue', 'income', 'money', 'earnings']
  collections: string[] // e.g., ['finance_transactions']
}




