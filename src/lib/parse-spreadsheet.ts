/**
 * Parse Excel (.xlsx, .xls) and CSV files
 * Returns rows + inferred schema for chat
 */

export interface ParseResult {
  rows: Record<string, unknown>[]
  fields: string[]
  rowCount: number
}

function parseCSV(buffer: Buffer): ParseResult {
  const text = buffer.toString('utf-8')
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { rows: [], fields: [], rowCount: 0 }

  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        inQuotes = !inQuotes
      } else if ((c === ',' && !inQuotes) || c === '\t') {
        result.push(current.trim())
        current = ''
      } else {
        current += c
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0]).map((h, j) => h.replace(/^"|"$/g, '').trim() || `col_${j}`)
  const rows: Record<string, unknown>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    const row: Record<string, unknown> = {}
    headers.forEach((h, j) => {
      let v = values[j] ?? ''
      if (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== '') {
        const n = Number(v)
        if (Number.isFinite(n)) row[h] = n
        else row[h] = v
      } else {
        row[h] = v
      }
    })
    rows.push(row)
  }
  return { rows, fields: headers, rowCount: rows.length }
}

function parseExcel(buffer: Buffer): ParseResult {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require('xlsx')
  const workbook = XLSX.read(buffer, { type: 'buffer', raw: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) return { rows: [], fields: [], rowCount: 0 }
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }) as Record<string, unknown>[]
  if (data.length === 0) return { rows: [], fields: [], rowCount: 0 }
  const fields = Object.keys(data[0] || {})
  return { rows: data, fields, rowCount: data.length }
}

export function parseSpreadsheet(buffer: Buffer, filename: string): ParseResult {
  const ext = (filename || '').toLowerCase()
  if (ext.endsWith('.csv')) return parseCSV(buffer)
  if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) return parseExcel(buffer)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) return parseExcel(buffer)
  return parseCSV(buffer)
}
