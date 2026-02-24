/**
 * Firestore Database Adapter
 * Implements DatabaseAdapter for Firestore (existing implementation)
 */

import { getAdminDb } from '@/infrastructure/firebase/firebase-server'
import type { DatabaseAdapter, DatabaseConnection, QueryFilters, QueryResult } from './base-adapter'

export class FirestoreAdapter implements DatabaseAdapter {
  private connection: DatabaseConnection | null = null

  async connect(connection: DatabaseConnection): Promise<void> {
    this.connection = connection
    // Firestore connection is handled by getAdminDb()
    // No explicit connection needed
  }

  async testConnection(connection: DatabaseConnection): Promise<boolean> {
    try {
      // Firestore is always available if Firebase is initialized
      const adminDb = getAdminDb()
      if (!adminDb) {
        return false
      }
      return true
    } catch (error) {
      console.error('Firestore connection test failed:', error)
      return false
    }
  }

  async query(collection: string, filters: QueryFilters): Promise<QueryResult> {
    const adminDb = getAdminDb()
    let query: FirebaseFirestore.Query = adminDb.collection(collection)
    
    // Apply filters dynamically
    if (filters.dateRange) {
      const dateField = this.getDateField(collection)
      query = query.where(dateField, ">=", filters.dateRange.start)
      query = query.where(dateField, "<=", filters.dateRange.end)
    }
    
    if (filters.category) {
      query = query.where("category", "==", filters.category)
    }
    
    if (filters.status) {
      query = query.where("status", "==", filters.status)
    }
    
    if (filters.department) {
      query = query.where("department", "==", filters.department)
    }
    
    if (filters.minAmount !== undefined) {
      const amountField = this.getAmountField(collection)
      query = query.where(amountField, ">=", filters.minAmount)
    }
    
    if (filters.maxAmount !== undefined) {
      const amountField = this.getAmountField(collection)
      query = query.where(amountField, "<=", filters.maxAmount)
    }
    
    // Apply ordering
    if (filters.orderBy) {
      query = query.orderBy(
        filters.orderBy,
        filters.orderDirection || "desc"
      )
    } else {
      const dateField = this.getDateField(collection)
      query = query.orderBy(dateField, "desc")
    }
    
    // Apply limit
    const limit = filters.limit || 50
    query = query.limit(limit)
    
    const snapshot = await query.get()
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return {
      data,
      count: data.length,
    }
  }

  async getSchema(collection: string): Promise<{ fields: Array<{ name: string; type: string }> }> {
    const adminDb = getAdminDb()
    const snapshot = await adminDb.collection(collection).limit(1).get()
    
    if (snapshot.empty) {
      return { fields: [] }
    }
    
    const doc = snapshot.docs[0].data()
    const fields = Object.entries(doc).map(([key, value]) => ({
      name: key,
      type: this.inferType(value),
    }))
    
    return { fields }
  }

  async listTables(): Promise<string[]> {
    // Firestore doesn't have a native way to list collections
    // This would require maintaining a list separately
    // For now, return empty or known collections
    return ['finance_transactions', 'sales_deals', 'hr_employees']
  }

  async disconnect(): Promise<void> {
    // Firestore doesn't need explicit disconnection
    this.connection = null
  }

  private getDateField(collection: string): string {
    if (collection === 'finance_transactions') return 'date'
    if (collection === 'sales_deals') return 'expectedCloseDate'
    if (collection === 'hr_employees') return 'hireDate'
    return 'createdAt'
  }

  private getAmountField(collection: string): string {
    if (collection === 'finance_transactions') return 'amount'
    return 'value'
  }

  private inferType(value: any): string {
    if (value === null || value === undefined) return 'null'
    if (Array.isArray(value)) return 'array'
    if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) return 'date'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'string') return 'string'
    if (typeof value === 'object') return 'object'
    return 'unknown'
  }
}

