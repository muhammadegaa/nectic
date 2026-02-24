/**
 * Infrastructure: Firebase Server
 * Firebase initialization for server-side operations
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

let app: App | null = null
let adminAuth: ReturnType<typeof getAuth> | null = null
let adminDb: FirebaseFirestore.Firestore | null = null
let initError: Error | null = null

function initializeFirebaseAdmin() {
  if (app) {
    return // Already initialized
  }

  if (getApps().length > 0) {
    app = getApps()[0]
    adminAuth = getAuth(app)
    adminDb = getFirestore(app)
    return
  }

  // Initialize with service account if available
  try {
    let serviceAccount: any = null
    let projectId: string | undefined = undefined

    // Option 1: Service account key from environment variable (JSON string)
    // Support both FIREBASE_SERVICE_ACCOUNT_KEY and FIREBASE_ADMIN_SDK_KEY
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_ADMIN_SDK_KEY
    
    console.log('[firebase-server] Checking for service account key...')
    console.log('[firebase-server] FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    console.log('[firebase-server] FIREBASE_ADMIN_SDK_KEY exists:', !!process.env.FIREBASE_ADMIN_SDK_KEY)
    console.log('[firebase-server] serviceAccountKey length:', serviceAccountKey?.length || 0)
    
    // Check if the key exists and is not empty
    if (serviceAccountKey && serviceAccountKey.trim().length > 0) {
      try {
        // Validate it's valid JSON before parsing
        const trimmed = serviceAccountKey.trim()
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          serviceAccount = JSON.parse(trimmed)
          projectId = serviceAccount.project_id
        } else {
          console.warn('Firebase service account key does not appear to be valid JSON (does not start with {)')
        }
      } catch (e: any) {
        console.error('Failed to parse Firebase service account key:', e.message)
        console.error('Make sure the value is the entire JSON as a single-line string')
        // Don't throw during build - only at runtime
        if (process.env.NEXT_PHASE !== 'phase-production-build') {
          throw e
        }
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
      const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
      
      // During build, don't throw errors - just log warnings
      if (isProduction && !isBuildPhase) {
        const errorMsg = `Firebase Admin SDK: Service account credentials required in production. 
Please set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_ADMIN_SDK_KEY in Vercel environment variables.
The value should be the entire JSON service account key as a single-line string.
Get it from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key`
        console.error('❌', errorMsg)
        throw new Error(errorMsg)
      }
      
      if (isBuildPhase) {
        // During build, just log a warning but don't fail
        console.warn('⚠️  Firebase Admin SDK: No service account key found during build. This is OK if the key is set in Vercel environment variables.')
        // Return without initializing - will be initialized at runtime
        return
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
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
    if (isBuildPhase) {
      // During build, just log warning
      console.warn('⚠️  Firebase Admin SDK initialization warning during build:', error.message)
      return
    }
    // Don't throw during lazy initialization - let it fail gracefully when actually used
    console.error('Firebase Admin initialization error:', error.message)
    // Store the error so we can throw it when getAdminAuth is actually called
    initError = new Error(`Firebase Admin SDK initialization failed: ${error.message}. Please configure Firebase credentials.`)
  }
  
  if (app) {
    adminAuth = getAuth(app)
    adminDb = getFirestore(app)
  }
}

// Export getters that initialize on first access
export function getApp(): App {
  if (!app) {
    initializeFirebaseAdmin()
    if (!app) {
      throw new Error('Firebase Admin SDK: Failed to initialize. Please check your credentials.')
    }
  }
  return app
}

export function getAdminAuth() {
  if (!adminAuth) {
    initializeFirebaseAdmin()
    if (!adminAuth) {
      throw new Error('Firebase Admin SDK: Failed to initialize. Please check your credentials.')
    }
  }
  return adminAuth
}

export function getAdminDb() {
  if (!adminDb) {
    initializeFirebaseAdmin()
    if (!adminDb) {
      throw new Error('Firebase Admin SDK: Failed to initialize. Please check your credentials.')
    }
  }
  return adminDb
}

// For backward compatibility, export the values directly (but they'll be null until initialized)
export { app, adminAuth, adminDb }


