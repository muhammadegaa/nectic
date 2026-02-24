/**
 * Tool executor for uploaded data - same logic as demo-tool-executor
 * but uses session rows instead of sample data
 */

import type { UploadSession } from './upload-store'

function filterData(data: any[], filters: any): any[] {
  let result = [...data]
  const dateField = data[0] ? (Object.keys(data[0]).find((k) => /date|tanggal|tgl/i.test(k)) || Object.keys(data[0])[0]) : 'date'

  if (filters?.dateRange) {
    const start = new Date(filters.dateRange.start).getTime()
    const end = new Date(filters.dateRange.end).getTime()
    result = result.filter((d) => {
      const val = d[dateField] ?? d.date ?? d.createdAt
      if (!val) return false
      const t = new Date(val).getTime()
      return t >= start && t <= end
    })
  }
  const amountField = data[0] ? (Object.keys(data[0]).find((k) => /amount|value|jumlah|nilai/i.test(k)) || 'amount') : 'amount'
  if (filters?.category) {
    const catField = Object.keys(data[0] || {}).find((k) => /category|kategori|type|jenis/i.test(k)) || 'category'
    result = result.filter((d) => String(d[catField] ?? '').toLowerCase() === String(filters.category).toLowerCase())
  }
  if (filters?.minAmount !== undefined) {
    result = result.filter((d) => (d[amountField] ?? d.amount ?? d.value ?? 0) >= filters.minAmount)
  }
  if (filters?.maxAmount !== undefined) {
    result = result.filter((d) => (d[amountField] ?? d.amount ?? d.value ?? 0) <= filters.maxAmount)
  }

  const limit = filters?.limit ?? 50
  const orderBy = filters?.orderBy || dateField || 'date'
  const orderDir = filters?.orderDirection || 'desc'
  result.sort((a, b) => {
    const va = a[orderBy] ?? a.date ?? a.createdAt
    const vb = b[orderBy] ?? b.date ?? b.createdAt
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true })
    return orderDir === 'desc' ? -cmp : cmp
  })

  return result.slice(0, limit)
}

function analyzeData(data: any[], analysisType: string, groupBy?: string, metric?: string): any {
  if (!data?.length) return { error: 'No data to analyze' }
  const amountField = metric || (Object.keys(data[0] || {}).find((k) => /amount|value|jumlah/i.test(k)) || 'amount')

  switch (analysisType) {
    case 'statistics': {
      const amounts = data.map((d) => d[amountField] ?? d.amount ?? d.value).filter((v) => typeof v === 'number')
      if (!amounts.length) return { error: 'No numeric data' }
      const sum = amounts.reduce((a, b) => a + b, 0)
      return { type: 'statistics', count: amounts.length, sum, average: sum / amounts.length, min: Math.min(...amounts), max: Math.max(...amounts) }
    }
    case 'trend': {
      const dateField = Object.keys(data[0] || {}).find((k) => /date|tanggal/i.test(k)) || 'date'
      const grouped: Record<string, any[]> = {}
      data.forEach((d) => {
        const val = d[dateField] ?? d.date ?? d.createdAt ?? ''
        const key = String(val).substring(0, 7)
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(d)
      })
      const periods = Object.entries(grouped)
        .map(([period, items]) => ({
          period,
          count: items.length,
          total: items.reduce((s, i) => s + Math.abs((i[amountField] ?? i.amount ?? i.value) || 0), 0),
        }))
        .sort((a, b) => a.period.localeCompare(b.period))
      return { type: 'trend', periods }
    }
    case 'group': {
      const key = groupBy || 'category' || Object.keys(data[0] || {})[0]
      const grouped: Record<string, { count: number; total: number }> = {}
      data.forEach((d) => {
        const k = String(d[key] ?? 'unknown')
        if (!grouped[k]) grouped[k] = { count: 0, total: 0 }
        grouped[k].count++
        grouped[k].total += Math.abs((d[amountField] ?? d.amount ?? d.value) || 0)
      })
      return { type: 'group', groupBy: key, groups: Object.entries(grouped).map(([name, v]) => ({ name, ...v })) }
    }
    default:
      return { type: analysisType, count: data.length }
  }
}

export function executeUploadTool(session: UploadSession, toolName: string, args: any): any {
  const collectionName = session.schema.fields.length ? 'uploaded_data' : 'finance_transactions'
  const data = (session.rows as any[]).map((row, i) => ({ ...row, _rowIndex: i + 1 }))

  if (toolName === 'query_collection') {
    const collection = args?.collection
    if (collection && collection !== collectionName && collection !== 'finance_transactions') {
      return []
    }
    return filterData(data, args?.filters || {})
  }

  if (toolName === 'analyze_data') {
    const inputData = Array.isArray(args?.data) ? args.data : data
    return analyzeData(inputData, args?.analysisType || 'statistics', args?.groupBy, args?.metric)
  }

  if (toolName === 'get_collection_schema') {
    return {
      collection: collectionName,
      fields: session.schema.fields,
      _rowIndices: true,
    }
  }

  return { error: `Upload does not support tool: ${toolName}` }
}
