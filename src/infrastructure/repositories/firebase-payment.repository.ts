/**
 * Infrastructure: Firebase Payment Repository
 * Implements IPaymentRepository using Firestore
 */

import { IPaymentRepository } from '@/domain/repositories/payment.repository'
import { Subscription } from '@/domain/entities/payment.entity'
import { db, Timestamp } from '../firebase/firebase-client'
import { collection, doc, getDoc, setDoc, query, where, getDocs, updateDoc } from 'firebase/firestore'

export class FirebasePaymentRepository implements IPaymentRepository {
  private readonly subscriptionsCollection = 'subscriptions'

  async findSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    const q = query(
      collection(db, this.subscriptionsCollection),
      where('userId', '==', userId)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }

    // Get the most recent subscription
    const docs = snapshot.docs.sort((a, b) => {
      const aTime = a.data().createdAt?.toDate() || new Date(0)
      const bTime = b.data().createdAt?.toDate() || new Date(0)
      return bTime.getTime() - aTime.getTime()
    })

    return this.mapToEntity(docs[0].id, docs[0].data())
  }

  async findSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const q = query(
      collection(db, this.subscriptionsCollection),
      where('stripeSubscriptionId', '==', stripeSubscriptionId)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    return this.mapToEntity(doc.id, doc.data())
  }

  async createSubscription(
    subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Subscription> {
    const now = Timestamp.now()
    const subRef = doc(collection(db, this.subscriptionsCollection))
    
    await setDoc(subRef, {
      ...subscription,
      createdAt: now,
      updatedAt: now,
    })

    return {
      ...subscription,
      id: subRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    }
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Subscription>
  ): Promise<Subscription> {
    const subRef = doc(db, this.subscriptionsCollection, subscriptionId)
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    }

    // Remove id from updates if present
    delete updateData.id

    await updateDoc(subRef, updateData)

    const updated = await getDoc(subRef)
    if (!updated.exists()) {
      throw new Error('Subscription not found after update')
    }

    return this.mapToEntity(updated.id, updated.data())
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    return this.updateSubscription(subscriptionId, {
      status: 'canceled',
      cancelAtPeriodEnd: true,
    })
  }

  private mapToEntity(id: string, data: any): Subscription {
    return {
      id,
      userId: data.userId,
      tier: data.tier,
      status: data.status,
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripeCustomerId: data.stripeCustomerId,
      currentPeriodStart: data.currentPeriodStart?.toDate() || new Date(),
      currentPeriodEnd: data.currentPeriodEnd?.toDate() || new Date(),
      cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  }
}















