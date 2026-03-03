/**
 * MongoDB Database Adapter
 * Implements DatabaseAdapter for MongoDB databases
 */

import { MongoClient, Db, Collection } from 'mongodb'
import type { DatabaseAdapter, DatabaseConnection, QueryFilters, QueryResult } from './base-adapter'

export class MongoDBAdapter implements DatabaseAdapter {
  private client: MongoClient | null = null
  private db: Db | null = null
  private connection: DatabaseConnection | null = null

  async connect(connection: DatabaseConnection): Promise<void> {
    this.connection = connection
    
    let connectionString = connection.connectionString
    
    if (!connectionString) {
      const host = connection.host || 'localhost'
      const port = connection.port || 27017
      const database = connection.database || 'test'
      const username = connection.username
      const password = connection.password
      
      if (username && password) {
        connectionString = `mongodb://${username}:${password}@${host}:${port}/${database}`
      } else {
        connectionString = `mongodb://${host}:${port}/${database}`
      }
      
      if (connection.ssl) {
        connectionString += '?ssl=true'
      }
    }

    this.client = new MongoClient(connectionString, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    })

    await this.client.connect()
    this.db = this.client.db(connection.database)
  }

  async testConnection(connection: DatabaseConnection): Promise<boolean> {
    try {
      await this.connect(connection)
      await this.disconnect()
      return true
    } catch (error) {
      console.error('MongoDB connection test failed:', error)
      return false
    }
  }

  async query(collection: string, filters: QueryFilters): Promise<QueryResult> {
    if (!this.db || !this.client) {
      // Auto-reconnect if client is null
      if (this.connection) {
        await this.connect(this.connection)
      } else {
        throw new Error('Not connected to database')
      }
    }

    if (!this.db) {
      throw new Error('Database connection failed')
    }

    const coll: Collection = this.db.collection(collection)
    const query: any = {}

    // Date range filter
    if (filters.dateRange) {
      const dateField = 'date' // Try common field names
      query[dateField] = {
        $gte: new Date(filters.dateRange.start),
        $lte: new Date(filters.dateRange.end),
      }
    }

    // Category filter
    if (filters.category) {
      query.category = filters.category
    }

    // Status filter
    if (filters.status) {
      query.status = filters.status
    }

    // Department filter
    if (filters.department) {
      query.department = filters.department
    }

    // Amount filters
    if (filters.minAmount !== undefined) {
      query.amount = { ...query.amount, $gte: filters.minAmount }
    }

    if (filters.maxAmount !== undefined) {
      query.amount = { ...query.amount, $lte: filters.maxAmount }
    }

    // Build sort
    const sort: any = {}
    if (filters.orderBy) {
      sort[filters.orderBy] = filters.orderDirection === 'asc' ? 1 : -1
    } else {
      sort.createdAt = -1
    }

    // Limit
    const limit = filters.limit || 50

    try {
      const cursor = coll.find(query).sort(sort).limit(limit)
      const data = await cursor.toArray()
      
      // Convert MongoDB ObjectId to string
      const normalizedData = data.map(doc => {
        const { _id, ...rest } = doc
        return {
          id: _id.toString(),
          ...rest,
        }
      })

      return {
        data: normalizedData,
        count: normalizedData.length,
      }
    } catch (error: any) {
      console.error(`MongoDB query error for collection ${collection}:`, error.message)
      return {
        data: [],
        count: 0,
      }
    }
  }

  async getSchema(collection: string): Promise<{ fields: Array<{ name: string; type: string }> }> {
    if (!this.db) {
      throw new Error('Not connected to database')
    }

    try {
      const coll: Collection = this.db.collection(collection)
      const sample = await coll.findOne({})
      
      if (!sample) {
        return { fields: [] }
      }

      const fields = Object.entries(sample).map(([key, value]) => ({
        name: key === '_id' ? 'id' : key,
        type: this.inferType(value),
      }))

      return { fields }
    } catch (error: any) {
      console.error(`MongoDB schema error for collection ${collection}:`, error.message)
      return { fields: [] }
    }
  }

  async listTables(): Promise<string[]> {
    if (!this.db || !this.client) {
      // Auto-reconnect if client is null
      if (this.connection) {
        await this.connect(this.connection)
      } else {
        throw new Error('Not connected to database')
      }
    }

    if (!this.db) {
      throw new Error('Database connection failed')
    }

    try {
      const collections = await this.db.listCollections().toArray()
      return collections.map(col => col.name)
    } catch (error: any) {
      console.error('MongoDB listTables error:', error.message)
      return []
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.db = null
    }
  }

  private inferType(value: any): string {
    if (value === null || value === undefined) return 'null'
    if (Array.isArray(value)) return 'array'
    if (value instanceof Date) return 'date'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'string') return 'string'
    if (typeof value === 'object') return 'object'
    return 'unknown'
  }
}

