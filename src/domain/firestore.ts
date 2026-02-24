/**
 * Firestore S-DAL Types
 * Types for Secure Data Access Layer
 */

export interface AllowedCollectionConfig {
  name: string
  allowedFields: string[]
  whereConstraints?: string[]
}

export interface FirestoreQueryInput {
  agentId: string
  userId: string
  collection: string
  filters?: Array<{ field: string; op: string; value: unknown }>
  limit?: number
  orderBy?: { field: string; direction: 'asc' | 'desc' }
}

export interface FirestoreQueryResult {
  rows: Record<string, unknown>[]
  count: number
  collection: string
}

