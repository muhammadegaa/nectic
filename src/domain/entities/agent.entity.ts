/**
 * Agent Entity
 * Represents an AI agent configuration
 */

import type { DatabaseConnection } from '@/lib/db-adapters/base-adapter'

export interface Agent {
  id: string
  name: string
  description?: string
  collections: string[] // e.g., ['finance_transactions', 'sales_deals'] or table/collection names
  intentMappings: IntentMapping[] // Intent keywords → collections
  userId: string // User who owns this agent
  // Database connection (optional - if not provided, uses Firestore)
  databaseConnection?: DatabaseConnection
  createdAt: string
  updatedAt: string
}

export interface IntentMapping {
  intent: string // e.g., 'revenue', 'sales', 'employees'
  keywords: string[] // e.g., ['revenue', 'income', 'money', 'earnings']
  collections: string[] // e.g., ['finance_transactions']
}




