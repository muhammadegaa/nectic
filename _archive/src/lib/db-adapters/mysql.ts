/**
 * MySQL Database Adapter
 * Implements DatabaseAdapter for MySQL databases
 */

import { createPool, Pool, PoolConnection } from 'mysql2/promise'
import type { DatabaseAdapter, DatabaseConnection, QueryFilters, QueryResult } from './base-adapter'

export class MySQLAdapter implements DatabaseAdapter {
  private pool: Pool | null = null
  private connection: DatabaseConnection | null = null

  async connect(connection: DatabaseConnection): Promise<void> {
    this.connection = connection
    
    const config: any = {
      host: connection.host || 'localhost',
      port: connection.port || 3306,
      database: connection.database,
      user: connection.username,
      password: connection.password,
      ssl: connection.ssl ? { rejectUnauthorized: false } : false,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    }

    // Use connection string if provided
    if (connection.connectionString) {
      // Parse connection string
      const url = new URL(connection.connectionString)
      config.host = url.hostname
      config.port = parseInt(url.port) || 3306
      config.user = url.username
      config.password = url.password
      config.database = url.pathname.replace('/', '')
    }

    this.pool = createPool(config)

    // Test connection
    if (!this.pool) {
      throw new Error('Failed to create MySQL connection pool')
    }
    const conn = await this.pool.getConnection()
    conn.release()
  }

  async testConnection(connection: DatabaseConnection): Promise<boolean> {
    try {
      await this.connect(connection)
      await this.disconnect()
      return true
    } catch (error) {
      console.error('MySQL connection test failed:', error)
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

    // Date range filter
    if (filters.dateRange) {
      const dateColumns = ['date', 'created_at', 'updated_at', 'timestamp', 'createdAt', 'updatedAt']
      for (const col of dateColumns) {
        try {
          whereConditions.push(`${this.escapeIdentifier(col)} >= ? AND ${this.escapeIdentifier(col)} <= ?`)
          params.push(filters.dateRange.start, filters.dateRange.end)
          break
        } catch (e) {
          // Column doesn't exist, try next
        }
      }
    }

    // Category filter
    if (filters.category) {
      whereConditions.push(`category = ?`)
      params.push(filters.category)
    }

    // Status filter
    if (filters.status) {
      whereConditions.push(`status = ?`)
      params.push(filters.status)
    }

    // Department filter
    if (filters.department) {
      whereConditions.push(`department = ?`)
      params.push(filters.department)
    }

    // Amount filters
    if (filters.minAmount !== undefined) {
      const amountColumns = ['amount', 'value', 'price', 'cost']
      for (const col of amountColumns) {
        try {
          whereConditions.push(`${this.escapeIdentifier(col)} >= ?`)
          params.push(filters.minAmount)
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
          whereConditions.push(`${this.escapeIdentifier(col)} <= ?`)
          params.push(filters.maxAmount)
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
      orderBy = `ORDER BY ${this.escapeIdentifier(filters.orderBy)} ${direction.toUpperCase()}`
    } else {
      orderBy = 'ORDER BY created_at DESC, id DESC'
    }

    // Build LIMIT
    const limit = filters.limit || 50

    // Build final query
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    const query = `
      SELECT * FROM ${this.escapeIdentifier(table)}
      ${whereClause}
      ${orderBy}
      LIMIT ?
    `
    params.push(limit)

    if (!this.pool) {
      throw new Error('Not connected to database')
    }

    try {
      const [rows] = await this.pool.query(query, params)
      
      return {
        data: Array.isArray(rows) ? rows.map(row => this.snakeToCamel(row as any)) : [],
        count: Array.isArray(rows) ? rows.length : 0,
      }
    } catch (error: any) {
      console.error(`MySQL query error for table ${table}:`, error.message)
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
          COLUMN_NAME as name,
          DATA_TYPE as type
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `

      const [rows] = await this.pool.query(query, [table])
      const fields = Array.isArray(rows) ? rows.map((row: any) => ({
        name: row.name,
        type: row.type,
      })) : []
      
      return { fields }
    } catch (error: any) {
      console.error(`MySQL schema error for table ${table}:`, error.message)
      return { fields: [] }
    }
  }

  async listTables(): Promise<string[]> {
    if (!this.pool) {
      throw new Error('Not connected to database')
    }

    try {
      const query = `
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `

      const pool = this.pool
      if (!pool) {
        throw new Error('Not connected to database')
      }

      const [rows] = await pool.query(query)
      return Array.isArray(rows) ? rows.map((row: any) => row.TABLE_NAME) : []
    } catch (error: any) {
      console.error('MySQL listTables error:', error.message)
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
    // MySQL uses backticks
    return `\`${identifier.replace(/`/g, '``')}\``
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

