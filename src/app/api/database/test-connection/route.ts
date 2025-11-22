/**
 * API Route: Test Database Connection
 * POST /api/database/test-connection
 * Tests a database connection without storing it
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { createAdapter } from '@/lib/db-adapters/adapter-factory'
import type { DatabaseConnection } from '@/lib/db-adapters/base-adapter'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    await requireAuth(request)

    const body = await request.json()
    const connection: DatabaseConnection = body

    if (!connection.type) {
      return NextResponse.json(
        { error: 'Database type is required' },
        { status: 400 }
      )
    }

    if (connection.type === 'firestore') {
      // Firestore is always available if Firebase is initialized
      return NextResponse.json({ success: true })
    }

    // Create adapter and test connection
    const adapter = createAdapter(connection)
    const isConnected = await adapter.testConnection(connection)

    if (isConnected) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to connect to database. Please check your credentials.' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Database connection test error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to test database connection' },
      { status: 500 }
    )
  }
}

