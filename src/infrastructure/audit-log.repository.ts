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

