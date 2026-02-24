/**
 * Infrastructure: Firebase Opportunity Repository
 * Implements IOpportunityRepository using Firestore
 */

import { IOpportunityRepository } from '@/domain/repositories/opportunity.repository'
import { AIOpportunity, OpportunityDetails } from '@/domain/entities/opportunity.entity'
import { db, Timestamp } from '../firebase/firebase-client'
import { collection, doc, getDoc, setDoc, query, where, getDocs, addDoc, deleteDoc, writeBatch } from 'firebase/firestore'

export class FirebaseOpportunityRepository implements IOpportunityRepository {
  private readonly opportunitiesCollection = 'opportunities'
  private readonly vendorsCollection = 'vendorRecommendations'
  private readonly guidesCollection = 'implementationGuides'

  async save(opportunity: Omit<AIOpportunity, 'id' | 'createdAt'>): Promise<AIOpportunity> {
    const oppRef = await addDoc(collection(db, this.opportunitiesCollection), {
      ...opportunity,
      createdAt: Timestamp.now(),
    })

    const saved = await getDoc(oppRef)
    return this.mapToEntity(saved.id, saved.data()!)
  }

  async saveMany(opportunities: Omit<AIOpportunity, 'id' | 'createdAt'>[]): Promise<AIOpportunity[]> {
    const batch = writeBatch(db)
    const refs: any[] = []

    opportunities.forEach(opp => {
      const ref = doc(collection(db, this.opportunitiesCollection))
      refs.push(ref)
      batch.set(ref, {
        ...opp,
        createdAt: Timestamp.now(),
      })
    })

    await batch.commit()

    // Fetch the saved opportunities
    const saved = await Promise.all(
      refs.map(async ref => {
        const doc = await getDoc(ref)
        return this.mapToEntity(doc.id, doc.data()!)
      })
    )

    return saved
  }

  async findByUserId(userId: string): Promise<AIOpportunity[]> {
    const q = query(
      collection(db, this.opportunitiesCollection),
      where('userId', '==', userId)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => this.mapToEntity(doc.id, doc.data()))
  }

  async findById(opportunityId: string): Promise<OpportunityDetails | null> {
    const oppDoc = await getDoc(doc(db, this.opportunitiesCollection, opportunityId))
    
    if (!oppDoc.exists()) {
      return null
    }

    const data = oppDoc.data()
    const base = this.mapToEntity(oppDoc.id, data)

    // Fetch vendor recommendations if premium
    let vendorRecommendations
    try {
      const vendorsQuery = query(
        collection(db, this.vendorsCollection),
        where('opportunityId', '==', opportunityId)
      )
      const vendorsSnapshot = await getDocs(vendorsQuery)
      vendorRecommendations = vendorsSnapshot.docs.map(doc => doc.data()) as any
    } catch (error) {
      // Vendors not available
      vendorRecommendations = undefined
    }

    // Fetch implementation guide if premium
    let implementationGuide
    try {
      const guideDoc = await getDoc(doc(db, this.guidesCollection, opportunityId))
      if (guideDoc.exists()) {
        implementationGuide = guideDoc.data() as any
      }
    } catch (error) {
      // Guide not available
      implementationGuide = undefined
    }

    return {
      ...base,
      vendorRecommendations,
      implementationGuide,
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    const q = query(
      collection(db, this.opportunitiesCollection),
      where('userId', '==', userId)
    )
    
    const snapshot = await getDocs(q)
    const batch = writeBatch(db)
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    await batch.commit()
  }

  private mapToEntity(id: string, data: any): AIOpportunity {
    return {
      id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      category: data.category,
      monthlySavings: data.monthlySavings,
      timeSavedHours: data.timeSavedHours,
      impactScore: data.impactScore,
      keyBenefits: data.keyBenefits,
      estimatedImplementationTime: data.estimatedImplementationTime,
      difficulty: data.difficulty,
      createdAt: data.createdAt?.toDate() || new Date(),
      isPremium: data.isPremium || false,
    }
  }
}





