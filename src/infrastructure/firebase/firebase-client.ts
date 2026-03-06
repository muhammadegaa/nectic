"use client"

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { getFirestore, Timestamp, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)

export const signUpWithEmail = async (email: string, password: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  return result.user
}

export const signInWithEmail = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export const signOutUser = () => signOut(auth)

export const onAuthStateChangedHelper = (callback: (user: FirebaseUser | null) => void) =>
  onAuthStateChanged(auth, callback)

export { auth, db, app, Timestamp, serverTimestamp, googleProvider }
