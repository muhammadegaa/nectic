/**
 * Seed Script for Populating Firebase Firestore with Dummy Enterprise Data
 * Run with: npm run seed
 */

import { getAdminDb } from '../firebase/firebase-server'
import { COLLECTIONS } from './schema'
import type { Transaction, Budget, Deal, Customer, SalesActivity, Employee, LeaveRequest, PerformanceReview } from './schema'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString()
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Remove undefined values from object (Firestore doesn't allow undefined)
function cleanUndefined(obj: any): any {
  const cleaned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value
    }
  }
  return cleaned
}

// ============================================================================
// FINANCE DATA GENERATORS
// ============================================================================

function generateTransactions(count: number): Transaction[] {
  const transactions: Transaction[] = []
  const categories = ['payroll', 'rent', 'software', 'marketing', 'sales', 'utilities', 'travel', 'office-supplies']
  const vendors = ['Microsoft', 'AWS', 'Salesforce', 'HubSpot', 'Slack', 'Zoom', 'Adobe', 'Google Workspace']
  const departments = ['Engineering', 'Sales', 'Marketing', 'Operations', 'HR']
  const accounts = ['checking', 'savings', 'credit_card']
  const types: ('income' | 'expense' | 'transfer')[] = ['expense', 'expense', 'expense', 'income', 'transfer']
  const statuses: ('pending' | 'cleared' | 'reconciled')[] = ['cleared', 'cleared', 'reconciled', 'pending']

  const startDate = new Date(2024, 0, 1)
  const endDate = new Date()

  for (let i = 0; i < count; i++) {
    const date = randomDate(startDate, endDate)
    const type = randomElement(types)
    const amount = type === 'income' 
      ? randomInt(5000, 50000)
      : randomInt(100, 10000)
    
    const transaction: any = {
      id: `txn_${i + 1}`,
      date,
      amount: type === 'expense' ? -amount : amount,
      currency: 'USD',
      type,
      category: randomElement(categories),
      description: `${randomElement(categories)} payment for ${randomElement(vendors)}`,
      account: randomElement(accounts),
      status: randomElement(statuses),
      department: randomElement(departments),
      projectCode: `PROJ-${randomInt(100, 999)}`,
      createdAt: date,
      updatedAt: date,
    }
    
    // Only add vendor if it's an expense
    if (type === 'expense') {
      transaction.vendor = randomElement(vendors)
    }
    
    transactions.push(transaction)
  }

  return transactions
}

function generateBudgets(): Budget[] {
  const departments = ['Engineering', 'Sales', 'Marketing', 'Operations', 'HR']
  const categories = ['payroll', 'software', 'marketing', 'travel', 'office-supplies']
  const quarters = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1']

  const budgets: Budget[] = []

  departments.forEach(dept => {
    categories.forEach(cat => {
      quarters.forEach(quarter => {
        const allocated = randomInt(10000, 100000)
        budgets.push({
          id: `budget_${dept}_${cat}_${quarter}`,
          department: dept,
          category: cat,
          allocatedAmount: allocated,
          spentAmount: randomInt(allocated * 0.3, allocated * 0.9),
          period: quarter,
          fiscalYear: 2024,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      })
    })
  })

  return budgets
}

// ============================================================================
// SALES DATA GENERATORS
// ============================================================================

function generateDeals(count: number): Deal[] {
  const deals: Deal[] = []
  const companies = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Digital Dynamics', 'Cloud Systems', 'Data Analytics Co', 'Software Solutions', 'Enterprise Tech']
  const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education']
  const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America']
  const sources = ['website', 'referral', 'cold-call', 'partner', 'event', 'social-media']
  const owners = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Chen', 'David Wilson']
  const stages: Deal['stage'][] = ['prospect', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost']

  const startDate = new Date(2024, 0, 1)
  const endDate = new Date()

  for (let i = 0; i < count; i++) {
    const stage = randomElement(stages)
    const probability = stage === 'closed-won' ? 100 : stage === 'closed-lost' ? 0 : randomInt(10, 90)
    const value = randomInt(5000, 200000)
    const createdAt = randomDate(startDate, endDate)
    const expectedClose = new Date(createdAt)
    expectedClose.setMonth(expectedClose.getMonth() + randomInt(1, 6))

    const deal: any = {
      id: `deal_${i + 1}`,
      name: `${randomElement(companies)} - ${randomElement(['Enterprise', 'SMB', 'Startup'])} Deal`,
      company: randomElement(companies),
      value,
      currency: 'USD',
      stage,
      probability,
      expectedCloseDate: expectedClose.toISOString(),
      owner: randomElement(owners),
      source: randomElement(sources),
      industry: randomElement(industries),
      region: randomElement(regions),
      createdAt,
      updatedAt: createdAt,
    }
    
    // Only add actualCloseDate if deal is closed
    if (stage === 'closed-won' || stage === 'closed-lost') {
      deal.actualCloseDate = randomDate(new Date(createdAt), new Date())
    }
    
    deals.push(deal)
  }

  return deals
}

function generateCustomers(count: number): Customer[] {
  const customers: Customer[] = []
  const companies = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Digital Dynamics', 'Cloud Systems', 'Data Analytics Co']
  const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing']
  const regions = ['North America', 'Europe', 'Asia Pacific']
  const statuses: Customer['status'][] = ['lead', 'customer', 'churned']

  const startDate = new Date(2023, 0, 1)
  const endDate = new Date()

  for (let i = 0; i < count; i++) {
    const company = randomElement(companies)
    const firstContact = randomDate(startDate, endDate)
    const lastContact = randomDate(new Date(firstContact), endDate)
    const status = randomElement(statuses)
    const ltv = status === 'customer' ? randomInt(10000, 500000) : randomInt(0, 50000)

    customers.push({
      id: `customer_${i + 1}`,
      name: `${randomElement(['John', 'Sarah', 'Mike', 'Emily', 'David'])} ${randomElement(['Smith', 'Johnson', 'Davis', 'Chen', 'Wilson'])}`,
      company,
      email: `contact@${company.toLowerCase().replace(/\s+/g, '')}.com`,
      phone: `+1-${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
      industry: randomElement(industries),
      region: randomElement(regions),
      annualRevenue: randomInt(1000000, 50000000),
      employeeCount: randomInt(10, 5000),
      status,
      firstContactDate: firstContact,
      lastContactDate: lastContact,
      lifetimeValue: ltv,
      createdAt: firstContact,
      updatedAt: lastContact,
    })
  }

  return customers
}

function generateSalesActivities(dealIds: string[]): SalesActivity[] {
  const activities: SalesActivity[] = []
  const types: SalesActivity['type'][] = ['call', 'email', 'meeting', 'demo', 'proposal']
  const owners = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Chen', 'David Wilson']
  const outcomes = ['Positive response', 'Needs follow-up', 'Scheduled next meeting', 'Requested proposal', 'Not interested']

  const startDate = new Date(2024, 0, 1)
  const endDate = new Date()

  dealIds.forEach(dealId => {
    const activityCount = randomInt(2, 8)
    for (let i = 0; i < activityCount; i++) {
      const type = randomElement(types)
      const date = randomDate(startDate, endDate)
      
      activities.push({
        id: `activity_${dealId}_${i}`,
        dealId,
        type,
        subject: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${randomElement(['Follow-up', 'Discovery', 'Proposal', 'Demo', 'Negotiation'])}`,
        notes: `Had a ${type} with the client. ${randomElement(outcomes)}.`,
        outcome: randomElement(outcomes),
        date,
        owner: randomElement(owners),
        createdAt: date,
      })
    }
  })

  return activities
}

// ============================================================================
// HR DATA GENERATORS
// ============================================================================

function generateEmployees(count: number): Employee[] {
  const employees: Employee[] = []
  const departments = ['Engineering', 'Sales', 'Marketing', 'Operations', 'HR', 'Finance']
  const roles = {
    Engineering: ['Software Engineer', 'Senior Engineer', 'Engineering Manager', 'DevOps Engineer', 'QA Engineer'],
    Sales: ['Sales Rep', 'Senior Sales Rep', 'Sales Manager', 'Account Executive', 'Sales Director'],
    Marketing: ['Marketing Specialist', 'Content Manager', 'Marketing Manager', 'Growth Marketer', 'CMO'],
    Operations: ['Operations Manager', 'Operations Analyst', 'Office Manager', 'Facilities Coordinator'],
    HR: ['HR Coordinator', 'HR Manager', 'Recruiter', 'People Ops'],
    Finance: ['Accountant', 'Financial Analyst', 'CFO', 'Controller'],
  }
  const locations = ['San Francisco', 'New York', 'London', 'Remote', 'Austin', 'Seattle']
  const firstNames = ['John', 'Sarah', 'Mike', 'Emily', 'David', 'Jessica', 'Chris', 'Amanda', 'Ryan', 'Lisa']
  const lastNames = ['Smith', 'Johnson', 'Davis', 'Chen', 'Wilson', 'Brown', 'Taylor', 'Anderson', 'Martinez', 'Garcia']
  const skills = ['JavaScript', 'Python', 'Salesforce', 'Marketing Automation', 'Project Management', 'Data Analysis', 'Leadership', 'Communication']

  const startDate = new Date(2020, 0, 1)
  const endDate = new Date()

  for (let i = 0; i < count; i++) {
    const department = randomElement(departments)
    const role = randomElement(roles[department as keyof typeof roles])
    const firstName = randomElement(firstNames)
    const lastName = randomElement(lastNames)
    const hireDate = randomDate(startDate, endDate)
    const salary = randomInt(50000, 200000)
    const employeeSkills = skills.slice(0, randomInt(3, 6)).sort(() => Math.random() - 0.5)

    const employee: any = {
      id: `emp_${i + 1}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      phone: `+1-${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
      department,
      role,
      title: role,
      hireDate,
      employmentType: randomElement(['full-time', 'full-time', 'full-time', 'part-time', 'contractor']),
      salary,
      currency: 'USD',
      location: randomElement(locations),
      status: randomElement(['active', 'active', 'active', 'on-leave', 'terminated']),
      skills: employeeSkills,
      createdAt: hireDate,
      updatedAt: new Date().toISOString(),
    }
    
    // Only add managerId if employee has a manager (optional field)
    if (i > 5) {
      employee.managerId = `emp_${randomInt(1, 5)}`
    }
    
    employees.push(employee)
  }

  return employees
}

function generateLeaveRequests(employeeIds: string[]): LeaveRequest[] {
  const requests: LeaveRequest[] = []
  const types: LeaveRequest['type'][] = ['vacation', 'sick', 'personal', 'maternity', 'paternity']
  const statuses: LeaveRequest['status'][] = ['pending', 'approved', 'approved', 'rejected']
  const approvers = ['HR Manager', 'Department Head', 'CEO']

  const startDate = new Date(2024, 0, 1)
  const endDate = new Date(2025, 11, 31)

  employeeIds.forEach(empId => {
    const requestCount = randomInt(0, 3)
    for (let i = 0; i < requestCount; i++) {
      const start = randomDate(startDate, endDate)
      const days = randomInt(1, 10)
      const end = new Date(start)
      end.setDate(end.getDate() + days)
      const status = randomElement(statuses)

      const request: any = {
        id: `leave_${empId}_${i}`,
        employeeId: empId,
        type: randomElement(types),
        startDate: start,
        endDate: end.toISOString(),
        days,
        status,
        notes: `Leave request for ${randomElement(['family event', 'medical', 'vacation', 'personal matter'])}`,
        createdAt: randomDate(new Date(2024, 0, 1), new Date(start)),
        updatedAt: status === 'approved' || status === 'rejected' 
          ? randomDate(new Date(start), new Date())
          : new Date().toISOString(),
      }
      
      // Only add approvedBy if status is approved
      if (status === 'approved') {
        request.approvedBy = randomElement(approvers)
      }
      
      requests.push(request)
    }
  })

  return requests
}

function generatePerformanceReviews(employeeIds: string[]): PerformanceReview[] {
  const reviews: PerformanceReview[] = []
  const periods = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2024-annual']
  const goals = [
    'Increase sales by 20%',
    'Complete 5 major features',
    'Improve customer satisfaction scores',
    'Reduce operational costs by 10%',
    'Launch new marketing campaign',
    'Hire 3 new team members',
  ]
  const achievements = [
    'Exceeded sales targets',
    'Delivered project on time',
    'Improved team collaboration',
    'Implemented cost-saving measures',
    'Received positive customer feedback',
  ]
  const improvements = [
    'Improve time management',
    'Enhance communication skills',
    'Take on more leadership responsibilities',
    'Develop technical expertise',
    'Build stronger client relationships',
  ]

  employeeIds.forEach(empId => {
    const reviewCount = randomInt(1, 3)
    periods.slice(0, reviewCount).forEach(period => {
      const rating = randomInt(3, 5)
      const nextReview = new Date()
      nextReview.setMonth(nextReview.getMonth() + 3)

      reviews.push({
        id: `review_${empId}_${period}`,
        employeeId: empId,
        reviewPeriod: period,
        reviewerId: `emp_${randomInt(1, 5)}`,
        rating,
        goals: goals.slice(0, randomInt(3, 5)).sort(() => Math.random() - 0.5),
        achievements: achievements.slice(0, randomInt(2, 4)).sort(() => Math.random() - 0.5),
        areasForImprovement: improvements.slice(0, randomInt(1, 3)).sort(() => Math.random() - 0.5),
        nextReviewDate: nextReview.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    })
  })

  return reviews
}

// ============================================================================
// SEED FUNCTION
// ============================================================================

export async function seedDatabase() {
  console.log('🌱 Starting database seed...')

  try {
    // Finance Data
    console.log('📊 Seeding finance data...')
    const transactions = generateTransactions(200)
    const budgets = generateBudgets()

    const adminDb = getAdminDb()
    for (const txn of transactions) {
      await adminDb.collection(COLLECTIONS.FINANCE.TRANSACTIONS).doc(txn.id).set(cleanUndefined(txn))
    }
    console.log(`✅ Seeded ${transactions.length} transactions`)

    for (const budget of budgets) {
      await adminDb.collection(COLLECTIONS.FINANCE.BUDGETS).doc(budget.id).set(budget)
    }
    console.log(`✅ Seeded ${budgets.length} budgets`)

    // Sales Data
    console.log('💼 Seeding sales data...')
    const deals = generateDeals(50)
    const customers = generateCustomers(30)
    const activities = generateSalesActivities(deals.map(d => d.id))

    for (const deal of deals) {
      await adminDb.collection(COLLECTIONS.SALES.DEALS).doc(deal.id).set(cleanUndefined(deal))
    }
    console.log(`✅ Seeded ${deals.length} deals`)

    for (const customer of customers) {
      await adminDb.collection(COLLECTIONS.SALES.CUSTOMERS).doc(customer.id).set(customer)
    }
    console.log(`✅ Seeded ${customers.length} customers`)

    for (const activity of activities) {
      await adminDb.collection(COLLECTIONS.SALES.ACTIVITIES).doc(activity.id).set(activity)
    }
    console.log(`✅ Seeded ${activities.length} sales activities`)

    // HR Data
    console.log('👥 Seeding HR data...')
    const employees = generateEmployees(25)
    const leaveRequests = generateLeaveRequests(employees.map(e => e.id))
    const reviews = generatePerformanceReviews(employees.map(e => e.id))

    for (const emp of employees) {
      await adminDb.collection(COLLECTIONS.HR.EMPLOYEES).doc(emp.id).set(cleanUndefined(emp))
    }
    console.log(`✅ Seeded ${employees.length} employees`)

    for (const leave of leaveRequests) {
      await adminDb.collection(COLLECTIONS.HR.LEAVE_REQUESTS).doc(leave.id).set(cleanUndefined(leave))
    }
    console.log(`✅ Seeded ${leaveRequests.length} leave requests`)

    for (const review of reviews) {
      await adminDb.collection(COLLECTIONS.HR.PERFORMANCE_REVIEWS).doc(review.id).set(review)
    }
    console.log(`✅ Seeded ${reviews.length} performance reviews`)

    console.log('🎉 Database seed completed successfully!')
    console.log('\n📈 Summary:')
    console.log(`   Finance: ${transactions.length} transactions, ${budgets.length} budgets`)
    console.log(`   Sales: ${deals.length} deals, ${customers.length} customers, ${activities.length} activities`)
    console.log(`   HR: ${employees.length} employees, ${leaveRequests.length} leave requests, ${reviews.length} reviews`)

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

