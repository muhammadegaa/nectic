/**
 * Audit Log Repository
 * Logs all data access operations for security and compliance
 */

import { getAdminDb } from './firebase/firebase-server'

export interface AuditLogEntry {
  userId: string
  agentId: string
  source: 'firestore' | 'postgresql' | 'mysql' | 'mongodb' | 'api' | 'tool_call'
  collection?: string
  table?: string
  filters?: Array<{ field: string; op: string }>
  rowCount?: number
  timestamp: string
  error?: string
  denied?: boolean // true if access was denied
  durationMs?: number
  // Tool call specific fields
  toolName?: string
  inputSummary?: string
  success?: boolean
  type?: 'data_access' | 'tool_call'
}

const AUDIT_COLLECTION = 'audit_logs'

/**
 * Log a data access operation
 */
export async function logDataAccess(entry: AuditLogEntry): Promise<void> {
  try {
    const adminDb = getAdminDb()
    await adminDb.collection(AUDIT_COLLECTION).add({
      ...entry,
      type: 'data_access',
      createdAt: new Date().toISOString(),
    })
  } catch (error: any) {
    // Don't throw - audit logging should not break the main flow
    console.error('[AuditLog] Failed to log data access:', error.message)
  }
}

export interface ToolCallLogInput {
  userId: string
  agentId: string
  toolName: string
  inputSummary?: string // Safe, non-sensitive summary (e.g. collection name, not full query)
  success: boolean
  errorMessage?: string
  timestamp: Date
  durationMs?: number
}

/**
 * Log a tool call execution
 * @param input - Tool call log input
 */
export async function logToolCall(input: ToolCallLogInput): Promise<void> {
  try {
    const adminDb = getAdminDb()
    await adminDb.collection(AUDIT_COLLECTION).add({
      userId: input.userId,
      agentId: input.agentId,
      source: 'tool_call',
      type: 'tool_call',
      toolName: input.toolName,
      inputSummary: input.inputSummary,
      success: input.success,
      error: input.errorMessage,
      denied: !input.success && input.errorMessage?.includes('not allowed'),
      timestamp: input.timestamp.toISOString(),
      durationMs: input.durationMs,
      createdAt: new Date().toISOString(),
    })
  } catch (error: any) {
    // Don't throw - audit logging should not break the main flow
    console.error('[AuditLog] Failed to log tool call:', error.message)
  }
}

export interface AuditLogListItem {
  id: string
  type: 'data_access' | 'tool_call'
  agentId: string
  userId: string
  source: string
  toolName?: string
  collection?: string
  success?: boolean
  denied?: boolean
  timestamp: string
  inputSummary?: string
  rowCount?: number
  errorMessage?: string
  durationMs?: number
}

export interface ListAuditLogsParams {
  agentId: string
  userId: string
  type?: 'data_access' | 'tool_call'
  limit?: number
}

/**
 * List audit logs for an agent
 * Scoped by userId to ensure users only see their own agents' logs
 */
export async function listAuditLogsByAgent(params: ListAuditLogsParams): Promise<AuditLogListItem[]> {
  try {
    const { agentId, userId, type, limit = 50 } = params
    const adminDb = getAdminDb()
    
    // Build query with proper index requirements
    // Note: Requires composite index on (agentId, userId, timestamp) or (agentId, userId, type, timestamp)
    let query: FirebaseFirestore.Query = adminDb.collection(AUDIT_COLLECTION)
      .where('agentId', '==', agentId)
      .where('userId', '==', userId) // Ensure user can only see their own agents' logs
    
    if (type) {
      query = query.where('type', '==', type)
    }
    
    // Order by timestamp (requires composite index - see firestore.indexes.json)
    query = query.orderBy('timestamp', 'desc').limit(limit)
    
    const snapshot = await query.get()
    
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        type: data.type || (data.source === 'tool_call' ? 'tool_call' : 'data_access'),
        agentId: data.agentId,
        userId: data.userId,
        source: data.source || 'unknown',
        toolName: data.toolName,
        collection: data.collection,
        success: data.success,
        denied: data.denied,
        timestamp: data.timestamp || data.createdAt,
        inputSummary: data.inputSummary,
        rowCount: data.rowCount,
        errorMessage: data.error || data.errorMessage,
        durationMs: data.durationMs,
      } as AuditLogListItem
    })
  } catch (error: any) {
    console.error('[AuditLog] Failed to list audit logs:', error.message)
    throw error
  }
}

