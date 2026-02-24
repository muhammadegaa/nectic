/**
 * Secure Firestore Query Helper (S-DAL)
 * All agent tool Firestore queries must go through this layer
 */

import { getAdminDb } from '../firebase/firebase-server'
import { FirebaseAgentRepository } from '../repositories/firebase-agent.repository'
import { logDataAccess } from '../audit-log.repository'
import type { FirestoreQueryInput, FirestoreQueryResult, AllowedCollectionConfig } from '@/domain/firestore'
import { COLLECTIONS } from '../database/schema'
import { AccessDeniedError, ValidationError } from '@/domain/errors/access-errors'

// Field mappings per collection based on schema
const COLLECTION_FIELDS: Record<string, string[]> = {
  [COLLECTIONS.FINANCE.TRANSACTIONS]: [
    'id', 'date', 'amount', 'currency', 'type', 'category', 'description',
    'vendor', 'account', 'status', 'department', 'projectCode', 'createdAt', 'updatedAt'
  ],
  [COLLECTIONS.FINANCE.BUDGETS]: [
    'id', 'department', 'category', 'allocatedAmount', 'spentAmount',
    'period', 'fiscalYear', 'createdAt', 'updatedAt'
  ],
  [COLLECTIONS.SALES.DEALS]: [
    'id', 'name', 'company', 'value', 'currency', 'stage', 'probability',
    'expectedCloseDate', 'actualCloseDate', 'owner', 'source', 'industry',
    'region', 'createdAt', 'updatedAt'
  ],
  [COLLECTIONS.SALES.CUSTOMERS]: [
    'id', 'name', 'company', 'email', 'phone', 'industry', 'region',
    'annualRevenue', 'employeeCount', 'status', 'firstContactDate',
    'createdAt', 'updatedAt'
  ],
  [COLLECTIONS.HR.EMPLOYEES]: [
    'id', 'name', 'email', 'phone', 'department', 'role', 'title',
    'managerId', 'hireDate', 'employmentType', 'salary', 'currency',
    'location', 'status', 'skills', 'createdAt', 'updatedAt'
  ],
}

/**
 * Build allowed collections config from agent's collections array
 */
function buildAllowedCollections(collections: string[]): AllowedCollectionConfig[] {
  return collections.map(collectionName => ({
    name: collectionName,
    allowedFields: COLLECTION_FIELDS[collectionName] || ['id', 'createdAt', 'updatedAt'],
  }))
}

/**
 * Secure Firestore query with access control
 */
export async function safeQueryFirestore(input: FirestoreQueryInput): Promise<FirestoreQueryResult> {
  const { agentId, userId, collection, filters = [], limit = 50, orderBy } = input
  const startTime = Date.now()

  try {
    // 1. Load agent and verify ownership
    const agentRepo = new FirebaseAgentRepository()
    const agent = await agentRepo.findById(agentId)
    
    if (!agent) {
      throw new AccessDeniedError(`Agent ${agentId} not found`)
    }
    
    if (agent.userId !== userId) {
      await logDataAccess({
        userId,
        agentId,
        source: 'firestore',
        collection,
        filters: filters.map(f => ({ field: f.field, op: f.op })),
        rowCount: 0,
        timestamp: new Date().toISOString(),
        denied: true,
        error: 'Agent does not belong to user',
        durationMs: Date.now() - startTime,
      })
      throw new AccessDeniedError(`Agent ${agentId} does not belong to user ${userId}`)
    }

    // 2. Build allowed collections config
    const allowedCollections = (agent as any).firestoreAccess?.collections || buildAllowedCollections(agent.collections)
    const collectionConfig = allowedCollections.find((c: AllowedCollectionConfig) => c.name === collection)

    if (!collectionConfig) {
      const allowedNames = allowedCollections.map((c: AllowedCollectionConfig) => c.name).join(', ')
      await logDataAccess({
        userId,
        agentId,
        source: 'firestore',
        collection,
        filters: filters.map(f => ({ field: f.field, op: f.op })),
        rowCount: 0,
        timestamp: new Date().toISOString(),
        denied: true,
        error: `Collection ${collection} is not allowed`,
        durationMs: Date.now() - startTime,
      })
      throw new AccessDeniedError(`Collection ${collection} is not allowed for this agent. Allowed collections: ${allowedNames}`)
    }

    // 3. Validate filter fields
    for (const filter of filters) {
      if (!collectionConfig.allowedFields.includes(filter.field)) {
        await logDataAccess({
          userId,
          agentId,
          source: 'firestore',
          collection,
          filters: filters.map(f => ({ field: f.field, op: f.op })),
          rowCount: 0,
          timestamp: new Date().toISOString(),
          denied: true,
          error: `Field ${filter.field} is not allowed`,
          durationMs: Date.now() - startTime,
        })
        throw new ValidationError(`Field ${filter.field} is not allowed for collection ${collection}. Allowed fields: ${collectionConfig.allowedFields.join(', ')}`)
      }
    }

    // 4. Execute query
    const adminDb = getAdminDb()
    let query: FirebaseFirestore.Query = adminDb.collection(collection)

    // Apply filters
    for (const filter of filters) {
      if (filter.op === '==') {
        query = query.where(filter.field, '==', filter.value)
      } else if (filter.op === '>=') {
        query = query.where(filter.field, '>=', filter.value)
      } else if (filter.op === '<=') {
        query = query.where(filter.field, '<=', filter.value)
      } else if (filter.op === '>') {
        query = query.where(filter.field, '>', filter.value)
      } else if (filter.op === '<') {
        query = query.where(filter.field, '<', filter.value)
      }
    }

    // Apply ordering
    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction)
    } else {
      // Default order by createdAt desc
      query = query.orderBy('createdAt', 'desc')
    }

    // Apply limit
    query = query.limit(limit)

    const snapshot = await query.get()
    
    // 5. Strip disallowed fields from results
    const rows = snapshot.docs.map(doc => {
      const data = doc.data()
      const allowedData: Record<string, unknown> = { id: doc.id }
      
      for (const field of collectionConfig.allowedFields) {
        if (data[field] !== undefined) {
          allowedData[field] = data[field]
        }
      }
      
      return allowedData
    })

    // 6. Log successful access
    await logDataAccess({
      userId,
      agentId,
      source: 'firestore',
      collection,
      filters: filters.map(f => ({ field: f.field, op: f.op })),
      rowCount: rows.length,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    })

    return {
      rows,
      count: rows.length,
      collection,
    }
  } catch (error: any) {
    // Log failed access if not already logged
    if (!(error instanceof AccessDeniedError && error.message.includes('does not belong'))) {
      await logDataAccess({
        userId,
        agentId,
        source: 'firestore',
        collection,
        filters: filters.map(f => ({ field: f.field, op: f.op })),
        rowCount: 0,
        timestamp: new Date().toISOString(),
        denied: true,
        error: error.message || 'Query failed',
        durationMs: Date.now() - startTime,
      })
    }
    throw error
  }
}

