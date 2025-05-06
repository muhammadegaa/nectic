"use client"

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth"
import { getFirestore, serverTimestamp as firestoreServerTimestamp, type Firestore } from "firebase/firestore"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Create a lazy initialization pattern
let firebaseApp: FirebaseApp | undefined
let firebaseAuth: Auth | undefined
let firebaseDb: Firestore | undefined
let googleAuthProvider: GoogleAuthProvider | undefined
let isInitializing = false

// Function to initialize Firebase
function initializeFirebase() {
  // Skip initialization on server-side
  if (typeof window === "undefined") {
    return { app: undefined, auth: undefined, db: undefined, googleProvider: undefined }
  }

  // Prevent concurrent initialization attempts
  if (isInitializing) {
    return {
      app: firebaseApp,
      auth: firebaseAuth,
      db: firebaseDb,
      googleProvider: googleAuthProvider,
    }
  }

  try {
    isInitializing = true

    // Initialize Firebase app if it hasn't been initialized yet
    if (!firebaseApp) {
      if (getApps().length === 0) {
        firebaseApp = initializeApp(firebaseConfig)
      } else {
        firebaseApp = getApp()
      }
    }

    // Only initialize auth if app is available and not already initialized
    if (firebaseApp && !firebaseAuth) {
      try {
        firebaseAuth = getAuth(firebaseApp)
        googleAuthProvider = new GoogleAuthProvider()
      } catch (authError) {
        // Silently handle auth initialization errors
        // This prevents console errors when auth service isn't ready
      }
    }

    // Only initialize Firestore if app is available and not already initialized
    if (firebaseApp && !firebaseDb) {
      try {
        firebaseDb = getFirestore(firebaseApp)
      } catch (dbError) {
        // Silently handle Firestore initialization errors
        // This prevents console errors when Firestore service isn't ready
      }
    }

    return {
      app: firebaseApp,
      auth: firebaseAuth,
      db: firebaseDb,
      googleProvider: googleAuthProvider,
    }
  } catch (error) {
    // Silently handle general initialization errors
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb, googleProvider: googleAuthProvider }
  } finally {
    isInitializing = false
  }
}

// Initialize Firebase when this module is imported
const { app, auth, db, googleProvider } = initializeFirebase()

// Export Firebase instances
export { app, auth, db, googleProvider }

// Export Firebase utilities
export const serverTimestamp = firestoreServerTimestamp

// Export Timestamp type
import { Timestamp } from "firebase/firestore"
export { Timestamp }

// Create a function to get Firebase services (ensures they're initialized)
export function getFirebaseServices() {
  // Return existing instances if they're already initialized
  if (app && auth && db) {
    return { app, auth, db, googleProvider }
  }

  // Otherwise try to initialize again
  return initializeFirebase()
}
