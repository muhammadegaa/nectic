/**
 * Base Database Adapter Interface
 * All database adapters must implement this interface
 */

export interface DatabaseConnection {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'firestore'
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  connectionString?: string
  ssl?: boolean
  // For Firestore
  projectId?: string
  credentials?: string // JSON string of service account
}

export interface QueryFilters {
  dateRange?: { start: string; end: string }
  category?: string
  status?: string
  minAmount?: number
  maxAmount?: number
  department?: string
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  // Generic filters
  [key: string]: any
}

export interface QueryResult {
  data: any[]
  count: number
  schema?: {
    fields: Array<{ name: string; type: string }>
  }
}

export interface DatabaseAdapter {
  /**
   * Connect to the database
   */
  connect(connection: DatabaseConnection): Promise<void>

  /**
   * Test the connection
   */
  testConnection(connection: DatabaseConnection): Promise<boolean>

  /**
   * Query a table/collection with filters
   */
  query(table: string, filters: QueryFilters): Promise<QueryResult>

  /**
   * Get schema for a table/collection
   */
  getSchema(table: string): Promise<{
    fields: Array<{ name: string; type: string }>
  }>

  /**
   * List all tables/collections
   */
  listTables(): Promise<string[]>

  /**
   * Close the connection
   */
  disconnect(): Promise<void>
}

