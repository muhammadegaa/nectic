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
    } else {
      // In production (Vercel), we MUST have a service account key
      // Application Default Credentials don't work in Vercel without GCP integration
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
      
      if (isProduction) {
        const errorMsg = `Firebase Admin SDK: Service account credentials required in production. 
Please set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_ADMIN_SDK_KEY in Vercel environment variables.
The value should be the entire JSON service account key as a single-line string.
Get it from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key`
        console.error('❌', errorMsg)
        throw new Error(errorMsg)
      }
      
      // In development, try with project ID (may work if GCP credentials are configured locally)
      if (projectId) {
        try {
          app = initializeApp({
            projectId,
          })
          console.log('✅ Firebase Admin initialized with project ID (dev mode):', projectId)
        } catch (devError: any) {
          const errorMsg = `Firebase Admin SDK: No credentials found. 
For local development, either:
1. Set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local with the full JSON service account key
2. Place firebase-service-account.json in the project root
3. Configure GCP Application Default Credentials

Error: ${devError.message}`
          console.error('❌', errorMsg)
          throw new Error(errorMsg)
        }
      } else {
        const errorMsg = 'Firebase Admin SDK: No credentials or project ID found. Please set FIREBASE_SERVICE_ACCOUNT_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable.'
        console.error('❌', errorMsg)
        throw new Error(errorMsg)
      }
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


