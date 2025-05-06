"use client"

import { db } from "@/lib/firebase-client"
import { collection, getDocs, limit, query } from "firebase/firestore"

export async function checkFirestoreConnection(): Promise<boolean> {
  try {
    // Try to fetch a single document from any collection
    const surveysRef = collection(db, "surveys")
    const q = query(surveysRef, limit(1))
    await getDocs(q)
    return true
  } catch (error) {
    console.error("Firestore connection check failed:", error)
    return false
  }
}
