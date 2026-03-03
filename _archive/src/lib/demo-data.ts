/**
 * Demo data - works without Firebase. Used by /demo for "Try now" with zero setup.
 */

const CATEGORIES = ['payroll', 'rent', 'software', 'marketing', 'sales', 'utilities', 'travel', 'office-supplies']
const VENDORS = ['Microsoft', 'AWS', 'Salesforce', 'HubSpot', 'Slack', 'Zoom', 'Adobe', 'Google Workspace']
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Operations', 'HR']

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateDemoTransactions(): any[] {
  const transactions: any[] = []
  const start = new Date(2024, 0, 1).getTime()
  const end = Date.now()

  for (let i = 0; i < 150; i++) {
    const date = new Date(start + seededRandom(i) * (end - start)).toISOString()
    const type = i % 5 === 0 ? 'income' : 'expense'
    const amount = type === 'income'
      ? Math.floor(5000 + seededRandom(i + 100) * 45000)
      : Math.floor(100 + seededRandom(i + 200) * 9900)
    const catIdx = Math.floor(seededRandom(i + 300) * CATEGORIES.length)
    const deptIdx = Math.floor(seededRandom(i + 400) * DEPARTMENTS.length)
    const vendorIdx = Math.floor(seededRandom(i + 500) * VENDORS.length)

    transactions.push({
      id: `txn_${i + 1}`,
      date,
      amount: type === 'expense' ? -amount : amount,
      currency: 'USD',
      type,
      category: CATEGORIES[catIdx],
      description: `${CATEGORIES[catIdx]} - ${VENDORS[vendorIdx]}`,
      vendor: type === 'expense' ? VENDORS[vendorIdx] : undefined,
      account: 'checking',
      status: 'cleared',
      department: DEPARTMENTS[deptIdx],
      projectCode: `PROJ-${100 + (i % 900)}`,
      createdAt: date,
      updatedAt: date,
    })
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

let _cached: any[] | null = null

export function getDemoTransactions(): any[] {
  if (!_cached) _cached = generateDemoTransactions()
  return _cached
}
