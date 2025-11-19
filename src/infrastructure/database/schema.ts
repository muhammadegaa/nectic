/**
 * Database Schema Definitions for Nectic AI Agent Platform
 * Firebase Firestore Collections Structure
 */

// ============================================================================
// FINANCE COLLECTION
// ============================================================================

export interface Transaction {
  id: string
  date: string // ISO date string
  amount: number
  currency: string // 'USD', 'EUR', etc.
  type: 'income' | 'expense' | 'transfer'
  category: string // 'payroll', 'rent', 'software', 'sales', etc.
  description: string
  vendor?: string
  account: string // 'checking', 'savings', 'credit_card'
  status: 'pending' | 'cleared' | 'reconciled'
  department?: string
  projectCode?: string
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  department: string
  category: string
  allocatedAmount: number
  spentAmount: number
  period: string // '2025-Q1', '2025-01', etc.
  fiscalYear: number
  createdAt: string
  updatedAt: string
}

// ============================================================================
// SALES COLLECTION
// ============================================================================

export interface Deal {
  id: string
  name: string
  company: string
  value: number
  currency: string
  stage: 'prospect' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  probability: number // 0-100
  expectedCloseDate: string // ISO date
  actualCloseDate?: string
  owner: string // Sales rep name/ID
  source: string // 'website', 'referral', 'cold-call', etc.
  industry: string
  region: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  company: string
  email: string
  phone?: string
  industry: string
  region: string
  annualRevenue?: number
  employeeCount?: number
  status: 'lead' | 'customer' | 'churned'
  firstContactDate: string
  lastContactDate: string
  lifetimeValue: number
  createdAt: string
  updatedAt: string
}

export interface SalesActivity {
  id: string
  dealId: string
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal'
  subject: string
  notes: string
  outcome: string
  date: string
  owner: string
  createdAt: string
}

// ============================================================================
// HR COLLECTION
// ============================================================================

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  department: string
  role: string
  title: string
  managerId?: string
  hireDate: string
  employmentType: 'full-time' | 'part-time' | 'contractor'
  salary?: number
  currency: string
  location: string
  status: 'active' | 'on-leave' | 'terminated'
  skills: string[]
  createdAt: string
  updatedAt: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  type: 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity'
  startDate: string
  endDate: string
  days: number
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PerformanceReview {
  id: string
  employeeId: string
  reviewPeriod: string // '2025-Q1', '2024-annual', etc.
  reviewerId: string
  rating: number // 1-5
  goals: string[]
  achievements: string[]
  areasForImprovement: string[]
  nextReviewDate: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// COLLECTION NAMES
// ============================================================================

export const COLLECTIONS = {
  FINANCE: {
    TRANSACTIONS: 'finance_transactions',
    BUDGETS: 'finance_budgets',
  },
  SALES: {
    DEALS: 'sales_deals',
    CUSTOMERS: 'sales_customers',
    ACTIVITIES: 'sales_activities',
  },
  HR: {
    EMPLOYEES: 'hr_employees',
    LEAVE_REQUESTS: 'hr_leave_requests',
    PERFORMANCE_REVIEWS: 'hr_performance_reviews',
  },
} as const




