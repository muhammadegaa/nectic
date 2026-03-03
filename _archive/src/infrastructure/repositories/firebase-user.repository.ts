/**
 * Infrastructure: Firebase User Repository
 * Implements IUserRepository using Firestore
 */

import { IUserRepository } from '@/domain/repositories/user.repository'
import { UserProfile, UserPreferences } from '@/domain/entities/user.entity'
import { db, Timestamp } from '../firebase/firebase-client'
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

export class FirebaseUserRepository implements IUserRepository {
  private readonly usersCollection = 'users'
  private readonly preferencesCollection = 'userPreferences'

  async findById(userId: string): Promise<UserProfile | null> {
    const userDoc = await getDoc(doc(db, this.usersCollection, userId))
    
    if (!userDoc.exists()) {
      return null
    }

    const data = userDoc.data()
    return {
      id: userDoc.id,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      hasCompletedAssessment: data.hasCompletedAssessment || false,
      subscriptionTier: data.subscriptionTier || 'free',
      subscriptionStatus: data.subscriptionStatus,
      stripeCustomerId: data.stripeCustomerId,
    }
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    // Note: In production, you'd want to create an index for email queries
    // For now, this is a simplified version
    throw new Error('findByEmail not implemented - use findById instead')
  }

  async create(user: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const now = Timestamp.now()
    const userRef = doc(collection(db, this.usersCollection))
    
    await setDoc(userRef, {
      ...user,
      createdAt: now,
      updatedAt: now,
    })

    return {
      ...user,
      id: userRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    }
  }

  async update(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const userRef = doc(db, this.usersCollection, userId)
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    }

    // Remove id from updates if present
    delete updateData.id

    await updateDoc(userRef, updateData)

    const updated = await this.findById(userId)
    if (!updated) {
      throw new Error('User not found after update')
    }

    return updated
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const prefsRef = doc(db, this.preferencesCollection, userId)
    const existing = await getDoc(prefsRef)

    if (existing.exists()) {
      await updateDoc(prefsRef, preferences)
    } else {
      await setDoc(prefsRef, {
        userId,
        ...preferences,
      })
    }

    const updated = await getDoc(prefsRef)
    return {
      userId,
      notificationsEnabled: false,
      emailUpdates: false,
      ...updated.data(),
    } as UserPreferences
  }
}





