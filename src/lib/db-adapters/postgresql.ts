/**
 * PostgreSQL Database Adapter
 * Implements DatabaseAdapter for PostgreSQL databases
 */

import { Pool, Client, QueryResult as PGQueryResult } from 'pg'
import type { DatabaseAdapter, DatabaseConnection, QueryFilters, QueryResult } from './base-adapter'

export class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: Pool | null = null
  private connection: DatabaseConnection | null = null

  async connect(connection: DatabaseConnection): Promise<void> {
    this.connection = connection
    
    const config: any = {
      host: connection.host || 'localhost',
      port: connection.port || 5432,
      database: connection.database,
      user: connection.username,
      password: connection.password,
      ssl: connection.ssl ? { rejectUnauthorized: false } : false,
      max: 5, // Connection pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }

    // Use connection string if provided
    if (connection.connectionString) {
      this.pool = new Pool({ connectionString: connection.connectionString, ...config })
    } else {
      this.pool = new Pool(config)
    }

    // Test connection
    const client = await this.pool.connect()
    client.release()
  }

  async testConnection(connection: DatabaseConnection): Promise<boolean> {
    try {
      await this.connect(connection)
      await this.disconnect()
      return true
    } catch (error) {
      console.error('PostgreSQL connection test failed:', error)
      return false
    }
  }

  async query(table: string, filters: QueryFilters): Promise<QueryResult> {
    if (!this.pool) {
      // Auto-reconnect if pool is null
      if (this.connection) {
        await this.connect(this.connection)
      } else {
        throw new Error('Not connected to database')
      }
    }

    // Build WHERE clause from filters
    const whereConditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Date range filter
    if (filters.dateRange) {
      // Try common date column names
      const dateColumns = ['date', 'created_at', 'updated_at', 'timestamp', 'createdAt', 'updatedAt']
      for (const col of dateColumns) {
        try {
          whereConditions.push(`${col} >= $${paramIndex} AND ${col} <= $${paramIndex + 1}`)
          params.push(filters.dateRange.start, filters.dateRange.end)
          paramIndex += 2
          break
        } catch (e) {
          // Column doesn't exist, try next
        }
      }
    }

    // Category filter
    if (filters.category) {
      whereConditions.push(`category = $${paramIndex}`)
      params.push(filters.category)
      paramIndex++
    }

    // Status filter
    if (filters.status) {
      whereConditions.push(`status = $${paramIndex}`)
      params.push(filters.status)
      paramIndex++
    }

    // Department filter
    if (filters.department) {
      whereConditions.push(`department = $${paramIndex}`)
      params.push(filters.department)
      paramIndex++
    }

    // Amount filters
    if (filters.minAmount !== undefined) {
      // Try common amount column names
      const amountColumns = ['amount', 'value', 'price', 'cost']
      for (const col of amountColumns) {
        try {
          whereConditions.push(`${col} >= $${paramIndex}`)
          params.push(filters.minAmount)
          paramIndex++
          break
        } catch (e) {
          // Column doesn't exist
        }
      }
    }

    if (filters.maxAmount !== undefined) {
      const amountColumns = ['amount', 'value', 'price', 'cost']
      for (const col of amountColumns) {
        try {
          whereConditions.push(`${col} <= $${paramIndex}`)
          params.push(filters.maxAmount)
          paramIndex++
          break
        } catch (e) {
          // Column doesn't exist
        }
      }
    }

    // Build ORDER BY
    let orderBy = ''
    if (filters.orderBy) {
      const direction = filters.orderDirection || 'desc'
      orderBy = `ORDER BY ${filters.orderBy} ${direction.toUpperCase()}`
    } else {
      // Default: order by date or id
      orderBy = 'ORDER BY created_at DESC, id DESC'
    }

    // Build LIMIT
    const limit = filters.limit || 50
    const limitClause = `LIMIT $${paramIndex}`
    params.push(limit)

    // Build final query
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    const query = `
      SELECT * FROM ${this.escapeIdentifier(table)}
      ${whereClause}
      ${orderBy}
      ${limitClause}
    `

    if (!this.pool) {
      throw new Error('Not connected to database')
    }

    try {
      const pool = this.pool
      const result: PGQueryResult = await pool.query(query, params)
      
      return {
        data: result.rows.map(row => this.snakeToCamel(row)),
        count: result.rows.length,
      }
    } catch (error: any) {
      // If table doesn't exist or query fails, return empty
      console.error(`PostgreSQL query error for table ${table}:`, error.message)
      return {
        data: [],
        count: 0,
      }
    }
  }

  async getSchema(table: string): Promise<{ fields: Array<{ name: string; type: string }> }> {
    if (!this.pool) {
      throw new Error('Not connected to database')
    }

    try {
      const query = `
        SELECT 
          column_name as name,
          data_type as type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `

      const result = await this.pool.query(query, [table])
      
      return {
        fields: result.rows.map(row => ({
          name: row.name,
          type: row.type,
        })),
      }
    } catch (error: any) {
      console.error(`PostgreSQL schema error for table ${table}:`, error.message)
      return { fields: [] }
    }
  }

  async listTables(): Promise<string[]> {
    if (!this.pool) {
      throw new Error('Not connected to database')
    }

    try {
      const query = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `

      const pool = this.pool
      const result = await pool.query(query)
      return result.rows.map(row => row.table_name)
    } catch (error: any) {
      console.error('PostgreSQL listTables error:', error.message)
      return []
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }
  }

  private escapeIdentifier(identifier: string): string {
    // Simple escaping - in production, use proper escaping
    return `"${identifier.replace(/"/g, '""')}"`
  }

  private snakeToCamel(obj: any): any {
    const camelObj: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      camelObj[camelKey] = value
    }
    return camelObj
  }
}

