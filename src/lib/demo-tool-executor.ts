/**
 * Demo tool executor - no Firebase required.
 * Used by /api/chat/demo for "Try now" with zero setup.
 */

import { getDemoTransactions } from './demo-data'

function filterData(data: any[], filters: any): any[] {
  let result = [...data]

  if (filters?.dateRange) {
    const start = new Date(filters.dateRange.start).getTime()
    const end = new Date(filters.dateRange.end).getTime()
    result = result.filter((d) => {
      const t = new Date(d.date).getTime()
      return t >= start && t <= end
    })
  }
  if (filters?.category) {
    result = result.filter((d) => d.category === filters.category)
  }
  if (filters?.status) {
    result = result.filter((d) => d.status === filters.status)
  }
  if (filters?.department) {
    result = result.filter((d) => d.department === filters.department)
  }
  if (filters?.minAmount !== undefined) {
    const field = filters.minAmount >= 0 ? 'amount' : 'amount'
    result = result.filter((d) => (d.amount ?? d.value) >= filters.minAmount)
  }
  if (filters?.maxAmount !== undefined) {
    const field = 'amount'
    result = result.filter((d) => (d.amount ?? d.value) <= filters.maxAmount)
  }

  const limit = filters?.limit ?? 50
  const orderBy = filters?.orderBy || 'date'
  const orderDir = filters?.orderDirection || 'desc'
  result.sort((a, b) => {
    const va = a[orderBy] ?? a.createdAt
    const vb = b[orderBy] ?? b.createdAt
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true })
    return orderDir === 'desc' ? -cmp : cmp
  })

  return result.slice(0, limit)
}

function analyzeData(data: any[], analysisType: string, groupBy?: string, metric?: string): any {
  if (!data?.length) return { error: 'No data to analyze' }

  const amountField = metric || 'amount'

  switch (analysisType) {
    case 'statistics': {
      const amounts = data.map((d) => d[amountField] ?? d.value).filter((v) => typeof v === 'number')
      if (!amounts.length) return { error: 'No numeric data' }
      const sum = amounts.reduce((a, b) => a + b, 0)
      return {
        type: 'statistics',
        count: amounts.length,
        sum,
        average: sum / amounts.length,
        min: Math.min(...amounts),
        max: Math.max(...amounts),
      }
    }
    case 'trend': {
      const grouped: Record<string, any[]> = {}
      data.forEach((d) => {
        const key = (d.date || d.createdAt || '').substring(0, 7)
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(d)
      })
      const periods = Object.entries(grouped)
        .map(([period, items]) => ({
          period,
          count: items.length,
          total: items.reduce((s, i) => s + Math.abs((i.amount ?? i.value) || 0), 0),
        }))
        .sort((a, b) => a.period.localeCompare(b.period))
      return { type: 'trend', periods }
    }
    case 'group': {
      const key = groupBy || 'category'
      const grouped: Record<string, { count: number; total: number }> = {}
      data.forEach((d) => {
        const k = String(d[key] ?? 'unknown')
        if (!grouped[k]) grouped[k] = { count: 0, total: 0 }
        grouped[k].count++
        grouped[k].total += Math.abs((d.amount ?? d.value) || 0)
      })
      return {
        type: 'group',
        groupBy: key,
        groups: Object.entries(grouped).map(([name, v]) => ({ name, ...v })),
      }
    }
    default:
      return { type: analysisType, count: data.length }
  }
}

export async function executeDemoTool(toolName: string, args: any): Promise<any> {
  if (toolName === 'query_collection') {
    const collection = args?.collection
    if (collection !== 'finance_transactions') {
      return []
    }
    const data = getDemoTransactions()
    return filterData(data, args?.filters || {})
  }

  if (toolName === 'analyze_data') {
    const data = Array.isArray(args?.data) ? args.data : getDemoTransactions()
    return analyzeData(
      data,
      args?.analysisType || 'statistics',
      args?.groupBy,
      args?.metric
    )
  }

  if (toolName === 'get_collection_schema') {
    return {
      collection: 'finance_transactions',
      fields: ['id', 'date', 'amount', 'currency', 'type', 'category', 'description', 'vendor', 'department', 'status'],
    }
  }

  return { error: `Demo does not support tool: ${toolName}` }
}
