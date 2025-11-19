/**
 * Infrastructure: Firebase Server
 * Firebase initialization for server-side operations
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

let app: App
let adminAuth: ReturnType<typeof getAuth>
let adminDb: FirebaseFirestore.Firestore

if (getApps().length === 0) {
  // Initialize with service account if available
  try {
    let serviceAccount: any = null
    let projectId: string | undefined = undefined

    // Option 1: Service account key from environment variable (JSON string)
    // Support both FIREBASE_SERVICE_ACCOUNT_KEY and FIREBASE_ADMIN_SDK_KEY
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_ADMIN_SDK_KEY
    if (serviceAccountKey) {
      try {
        serviceAccount = JSON.parse(serviceAccountKey)
        projectId = serviceAccount.project_id
      } catch (e) {
        console.error('Failed to parse Firebase service account key:', e)
        console.error('Make sure the value is the entire JSON as a single-line string')
      }
    } 
    // Option 2: Service account key from file
    else {
      const fs = require('fs')
      const path = require('path')
      const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json')
      
      if (fs.existsSync(serviceAccountPath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
          projectId = serviceAccount.project_id
        } catch (e) {
          console.error('Failed to parse firebase-service-account.json:', e)
        }
      }
    }

    // Option 3: Try project ID from env var
    if (!projectId) {
      projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
    }

    // Initialize with credentials if available
    if (serviceAccount) {
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId || serviceAccount.project_id,
      })
      console.log('✅ Firebase Admin initialized with service account')
    } else if (projectId) {
      // Initialize with just project ID (for Vercel with default credentials)
      // This works if Vercel has default GCP credentials configured
      app = initializeApp({
        projectId,
      })
      console.log('✅ Firebase Admin initialized with project ID:', projectId)
    } else {
      const errorMsg = 'Firebase Admin SDK: No credentials or project ID found. Please set FIREBASE_SERVICE_ACCOUNT_KEY (as JSON string) or NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable in Vercel.'
      console.error('❌', errorMsg)
      throw new Error(errorMsg)
    }
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message)
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}. Please configure Firebase credentials.`)
  }
  
  adminAuth = getAuth(app)
  adminDb = getFirestore(app)
} else {
  app = getApps()[0]
  adminAuth = getAuth(app)
  adminDb = getFirestore(app)
}

export { app, adminAuth, adminDb }


