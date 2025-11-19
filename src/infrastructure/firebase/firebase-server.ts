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
    // Option 1: Service account key from environment variable (JSON string)
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (serviceAccountKey) {
      app = initializeApp({
        credential: cert(JSON.parse(serviceAccountKey))
      })
    } 
    // Option 2: Service account key from file
    else {
      const fs = require('fs')
      const path = require('path')
      const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json')
      
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
        app = initializeApp({
          credential: cert(serviceAccount)
        })
      } else {
        // Fallback to default credentials (for Vercel/Cloud Run)
        app = initializeApp()
      }
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
    // Fallback to default credentials
    app = initializeApp()
  }
  
  adminAuth = getAuth(app)
  adminDb = getFirestore(app)
} else {
  app = getApps()[0]
  adminAuth = getAuth(app)
  adminDb = getFirestore(app)
}

export { app, adminAuth, adminDb }


