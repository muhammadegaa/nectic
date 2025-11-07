import { collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase-client"

export async function migrateUsers() {
  try {
    const usersRef = collection(db, "users")
    const snapshot = await getDocs(usersRef)

    const updates: Promise<void>[] = []
    let count = 0

    snapshot.forEach((userDoc) => {
      const userData = userDoc.data()
      const userUpdates: Record<string, unknown> = {}

      // Add missing fields to user data
      if (!userData.industry) {
        userUpdates.industry = "general"
      }

      if (!userData.companySize) {
        userUpdates.companySize = "unknown"
      }

      if (!userData.role) {
        userUpdates.role = "unknown"
      }

      if (!userData.subscription) {
        userUpdates.subscription = {
          tier: "free",
          createdAt: Timestamp.now(),
        }
      } else if (!userData.subscription.tier) {
        userUpdates["subscription.tier"] = "free"
      }

      // Only update if there are changes
      if (Object.keys(userUpdates).length > 0) {
        updates.push(updateDoc(doc(db, "users", userDoc.id), userUpdates))
        count++
      }
    })

    if (count > 0) {
      await Promise.all(updates)
      console.log(`Updated ${count} users`)
    } else {
      console.log("No users needed migration")
    }

    return count
  } catch (error) {
    console.error("Error migrating users:", error)
    return 0
  }
}
