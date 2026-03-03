/**
 * Database Utilities for Querying Firestore Collections
 * Helper functions for common queries
 */

import { getAdminDb } from '../firebase/firebase-server'
import { COLLECTIONS } from './schema'
import type { Transaction, Deal, Employee } from './schema'

// ============================================================================
// FINANCE QUERIES
// ============================================================================

export async function getTransactions(filters?: {
  startDate?: string
  endDate?: string
  category?: string
  department?: string
  type?: 'income' | 'expense' | 'transfer'
  limit?: number
}): Promise<Transaction[]> {
  const adminDb = getAdminDb()
  let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.FINANCE.TRANSACTIONS)

  if (filters?.startDate) {
    query = query.where('date', '>=', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.where('date', '<=', filters.endDate)
  }
  if (filters?.category) {
    query = query.where('category', '==', filters.category)
  }
  if (filters?.department) {
    query = query.where('department', '==', filters.department)
  }
  if (filters?.type) {
    query = query.where('type', '==', filters.type)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const snapshot = await query.orderBy('date', 'desc').get()
  return snapshot.docs.map(doc => doc.data() as Transaction)
}

export async function getTransactionSummary(filters?: {
  startDate?: string
  endDate?: string
  department?: string
}) {
  const transactions = await getTransactions(filters)
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  const byCategory = transactions.reduce((acc, t) => {
    if (t.type === 'expense') {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount)
    }
    return acc
  }, {} as Record<string, number>)

  return {
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses,
    byCategory,
    transactionCount: transactions.length,
  }
}

// ============================================================================
// SALES QUERIES
// ============================================================================

export async function getDeals(filters?: {
  stage?: Deal['stage']
  owner?: string
  industry?: string
  minValue?: number
  limit?: number
}): Promise<Deal[]> {
  const adminDb = getAdminDb()
  let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.SALES.DEALS)

  if (filters?.stage) {
    query = query.where('stage', '==', filters.stage)
  }
  if (filters?.owner) {
    query = query.where('owner', '==', filters.owner)
  }
  if (filters?.industry) {
    query = query.where('industry', '==', filters.industry)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get()
  let deals = snapshot.docs.map(doc => doc.data() as Deal)

  if (filters?.minValue) {
    deals = deals.filter(d => d.value >= filters.minValue!)
  }

  return deals
}

export async function getSalesPipeline() {
  const deals = await getDeals()
  
  const byStage = deals.reduce((acc, deal) => {
    acc[deal.stage] = (acc[deal.stage] || 0) + deal.value
    return acc
  }, {} as Record<string, number>)

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0)
  const weightedValue = deals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0)

  return {
    totalDeals: deals.length,
    totalValue,
    weightedValue,
    byStage,
    avgDealSize: totalValue / deals.length,
  }
}

// ============================================================================
// HR QUERIES
// ============================================================================

export async function getEmployees(filters?: {
  department?: string
  status?: Employee['status']
  location?: string
}): Promise<Employee[]> {
  const adminDb = getAdminDb()
  let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.HR.EMPLOYEES)

  if (filters?.department) {
    query = query.where('department', '==', filters.department)
  }
  if (filters?.status) {
    query = query.where('status', '==', filters.status)
  }
  if (filters?.location) {
    query = query.where('location', '==', filters.location)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(doc => doc.data() as Employee)
}

export async function getDepartmentStats() {
  const employees = await getEmployees()
  
  const byDepartment = employees.reduce((acc, emp) => {
    if (!acc[emp.department]) {
      acc[emp.department] = { count: 0, totalSalary: 0, avgSalary: 0 }
    }
    acc[emp.department].count++
    if (emp.salary) {
      acc[emp.department].totalSalary += emp.salary
    }
    return acc
  }, {} as Record<string, { count: number; totalSalary: number; avgSalary: number }>)

  Object.keys(byDepartment).forEach(dept => {
    byDepartment[dept].avgSalary = byDepartment[dept].totalSalary / byDepartment[dept].count
  })

  return {
    totalEmployees: employees.length,
    byDepartment,
  }
}

// ============================================================================
// GENERIC QUERY HELPERS
// ============================================================================

export async function queryCollection(
  collectionName: string,
  filters?: Record<string, any>,
  orderBy?: { field: string; direction: 'asc' | 'desc' },
  limit?: number
) {
  const adminDb = getAdminDb()
  let query: FirebaseFirestore.Query = adminDb.collection(collectionName)

  if (filters) {
    Object.entries(filters).forEach(([field, value]) => {
      query = query.where(field, '==', value)
    })
  }

  if (orderBy) {
    query = query.orderBy(orderBy.field, orderBy.direction)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}




