/**
 * Data Preview API Route
 * POST /api/data-preview - Get sample data from selected collections
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/infrastructure/firebase/firebase-server'
import { requireAuth } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

// Define key fields for each collection
const COLLECTION_FIELDS: Record<string, string[]> = {
  finance_transactions: ['date', 'amount', 'category', 'description', 'type', 'currency'],
  sales_deals: ['name', 'company', 'value', 'stage', 'owner', 'expectedCloseDate'],
  hr_employees: ['firstName', 'lastName', 'email', 'department', 'role', 'hireDate'],
}

// Collection labels
const COLLECTION_LABELS: Record<string, string> = {
  finance_transactions: 'Finance Transactions',
  sales_deals: 'Sales Deals',
  hr_employees: 'HR Employees',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { collections } = body

    // Authenticate user via server-side auth
    let userId: string
    try {
      userId = await requireAuth(request)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      )
    }

    if (!collections || !Array.isArray(collections) || collections.length === 0) {
      return NextResponse.json(
        { error: 'Collections array is required' },
        { status: 400 }
      )
    }

    const results = []

    for (const collectionId of collections) {
      // Skip unsupported collections
      if (!COLLECTION_FIELDS[collectionId]) {
        continue
      }

      try {
        // Get sample documents (limit 8 for preview)
        const adminDb = getAdminDb()
        const snapshot = await adminDb
          .collection(collectionId)
          .limit(8)
          .get()

        // Get count estimate
        let countEstimate: number | null = null
        try {
          const countSnapshot = await adminDb
            .collection(collectionId)
            .count()
            .get()
          countEstimate = countSnapshot.data().count
        } catch (countError) {
          // Fallback to simple estimate if count query fails
          countEstimate = snapshot.size > 0 ? snapshot.size * 25 : null
        }

        // Extract key fields from documents
        const sample = snapshot.docs.map((doc) => {
          const data = doc.data()
          const keyFields = COLLECTION_FIELDS[collectionId]
          const sampleDoc: Record<string, any> = {}
          
          // Only include defined key fields
          for (const field of keyFields) {
            if (data[field] !== undefined) {
              sampleDoc[field] = data[field]
            }
          }
          
          return sampleDoc
        })

        results.push({
          id: collectionId,
          label: COLLECTION_LABELS[collectionId] || collectionId,
          countEstimate,
          sample,
        })
      } catch (error: any) {
        console.error(`Error querying collection ${collectionId}:`, error)
        // Continue with other collections even if one fails
        results.push({
          id: collectionId,
          label: COLLECTION_LABELS[collectionId] || collectionId,
          error: 'Failed to load preview',
        })
      }
    }

    return NextResponse.json({ collections: results })
  } catch (error: any) {
    console.error('Error in data preview API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data preview', message: error.message },
      { status: 500 }
    )
  }
}

