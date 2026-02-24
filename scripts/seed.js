/**
 * Seed Script - JavaScript version to avoid tsx/protobufjs issues
 * Run with: node scripts/seed.js
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const fs = require('fs')
const path = require('path')

// Initialize Firebase Admin
let app
if (getApps().length === 0) {
  try {
    const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json')
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
      app = initializeApp({
        credential: cert(serviceAccount)
      })
    } else {
      console.error('❌ firebase-service-account.json not found!')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message)
    process.exit(1)
  }
} else {
  app = getApps()[0]
}

const db = getFirestore(app)

// Helper functions
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString()
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function cleanUndefined(obj) {
  const cleaned = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value
    }
  }
  return cleaned
}

// Generate transactions
function generateTransactions(count) {
  const transactions = []
  const categories = ['payroll', 'rent', 'software', 'marketing', 'sales', 'utilities', 'travel', 'office-supplies']
  const vendors = ['Microsoft', 'AWS', 'Salesforce', 'HubSpot', 'Slack', 'Zoom', 'Adobe', 'Google Workspace']
  const departments = ['Engineering', 'Sales', 'Marketing', 'Operations', 'HR']
  const accounts = ['checking', 'savings', 'credit_card']
  const types = ['expense', 'expense', 'expense', 'income', 'transfer']
  const statuses = ['cleared', 'cleared', 'reconciled', 'pending']

  const startDate = new Date(2024, 0, 1)
  const endDate = new Date()

  for (let i = 0; i < count; i++) {
    const date = randomDate(startDate, endDate)
    const type = randomElement(types)
    const amount = type === 'income' ? randomInt(5000, 50000) : randomInt(100, 10000)
    
    const transaction = {
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
    
    if (type === 'expense') {
      transaction.vendor = randomElement(vendors)
    }
    
    transactions.push(transaction)
  }

  return transactions
}

// Generate deals
function generateDeals(count) {
  const deals = []
  const companies = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Digital Dynamics', 'Cloud Systems', 'Data Analytics Co', 'Software Solutions', 'Enterprise Tech']
  const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education']
  const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America']
  const sources = ['website', 'referral', 'cold-call', 'partner', 'event', 'social-media']
  const owners = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Chen', 'David Wilson']
  const stages = ['prospect', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost']

  const startDate = new Date(2024, 0, 1)
  const endDate = new Date()

  for (let i = 0; i < count; i++) {
    const stage = randomElement(stages)
    const probability = stage === 'closed-won' ? 100 : stage === 'closed-lost' ? 0 : randomInt(10, 90)
    const value = randomInt(5000, 200000)
    const createdAt = randomDate(startDate, endDate)
    const expectedClose = new Date(createdAt)
    expectedClose.setMonth(expectedClose.getMonth() + randomInt(1, 6))

    const deal = {
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
    
    if (stage === 'closed-won' || stage === 'closed-lost') {
      deal.actualCloseDate = randomDate(new Date(createdAt), new Date())
    }
    
    deals.push(deal)
  }

  return deals
}

// Generate employees
function generateEmployees(count) {
  const employees = []
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
    const role = randomElement(roles[department])
    const firstName = randomElement(firstNames)
    const lastName = randomElement(lastNames)
    const hireDate = randomDate(startDate, endDate)
    const salary = randomInt(50000, 200000)
    const employeeSkills = skills.slice(0, randomInt(3, 6)).sort(() => Math.random() - 0.5)

    const employee = {
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
    
    if (i > 5) {
      employee.managerId = `emp_${randomInt(1, 5)}`
    }
    
    employees.push(employee)
  }

  return employees
}

// Main seed function
async function seedDatabase() {
  console.log('🌱 Starting database seed...')

  try {
    // Finance
    console.log('📊 Seeding finance data...')
    const transactions = generateTransactions(200)
    for (const txn of transactions) {
      await db.collection('finance_transactions').doc(txn.id).set(cleanUndefined(txn))
    }
    console.log(`✅ Seeded ${transactions.length} transactions`)

    // Sales
    console.log('💼 Seeding sales data...')
    const deals = generateDeals(50)
    for (const deal of deals) {
      await db.collection('sales_deals').doc(deal.id).set(cleanUndefined(deal))
    }
    console.log(`✅ Seeded ${deals.length} deals`)

    // HR
    console.log('👥 Seeding HR data...')
    const employees = generateEmployees(25)
    for (const emp of employees) {
      await db.collection('hr_employees').doc(emp.id).set(cleanUndefined(emp))
    }
    console.log(`✅ Seeded ${employees.length} employees`)

    console.log('🎉 Database seed completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()




