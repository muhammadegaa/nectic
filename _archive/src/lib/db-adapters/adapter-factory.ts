/**
 * Database Adapter Factory
 * Creates the appropriate adapter based on connection type
 */

import { PostgreSQLAdapter } from './postgresql'
import { MySQLAdapter } from './mysql'
import { MongoDBAdapter } from './mongodb'
import { FirestoreAdapter } from './firestore'
import type { DatabaseAdapter, DatabaseConnection } from './base-adapter'

export function createAdapter(connection: DatabaseConnection): DatabaseAdapter {
  switch (connection.type) {
    case 'postgresql':
      return new PostgreSQLAdapter()
    case 'mysql':
      return new MySQLAdapter()
    case 'mongodb':
      return new MongoDBAdapter()
    case 'firestore':
      return new FirestoreAdapter()
    default:
      throw new Error(`Unsupported database type: ${connection.type}`)
  }
}

