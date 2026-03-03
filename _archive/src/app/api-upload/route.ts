/**
 * Excel/CSV upload - parse, infer schema, store in session
 * POST /api/upload - multipart form with file
 * Returns: { sessionId, rowCount, fields }
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseSpreadsheet } from '@/lib/parse-spreadsheet'
import { setUploadSession } from '@/lib/upload-store'
import { randomBytes } from 'crypto'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_ROWS = 10_000

export const dynamic = 'force-dynamic'

function generateSessionId(): string {
  return randomBytes(16).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const filename = file.name || 'upload.csv'
    const ext = filename.toLowerCase()
    if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Only CSV and Excel (.xlsx, .xls) files are supported' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = parseSpreadsheet(buffer, filename)

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'File has no data rows' }, { status: 400 })
    }

    if (result.rowCount > MAX_ROWS) {
      return NextResponse.json(
        { error: `Too many rows. Maximum is ${MAX_ROWS.toLocaleString()}` },
        { status: 400 }
      )
    }

    const sessionId = generateSessionId()
    const sampleRow = result.rows[0] || undefined

    await setUploadSession(sessionId, {
      schema: { fields: result.fields, sampleRow },
      rows: result.rows,
      rowCount: result.rowCount,
    })

    return NextResponse.json({
      sessionId,
      rowCount: result.rowCount,
      fields: result.fields,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to parse file', message: error?.message },
      { status: 500 }
    )
  }
}
