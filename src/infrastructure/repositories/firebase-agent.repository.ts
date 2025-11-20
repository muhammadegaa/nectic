/**
 * Firebase Agent Repository
 */

import { getAdminDb } from '../firebase/firebase-server'
import type { Agent } from '@/domain/entities/agent.entity'

export class FirebaseAgentRepository {
  private readonly collection = 'agents'

  async create(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    const adminDb = getAdminDb()
    const now = new Date().toISOString()
    const docRef = adminDb.collection(this.collection).doc()
    
    // Clean undefined values (Firestore doesn't allow undefined)
    const cleanedAgent = this.cleanUndefined({
      ...agent,
      createdAt: now,
      updatedAt: now,
    })
    
    const newAgent: Agent = {
      id: docRef.id,
      ...cleanedAgent,
    } as Agent

    await docRef.set(newAgent)
    return newAgent
  }

  private cleanUndefined(obj: any): any {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = value
      }
    }
    return cleaned
  }

  async findById(id: string): Promise<Agent | null> {
    const adminDb = getAdminDb()
    const doc = await adminDb.collection(this.collection).doc(id).get()
    if (!doc.exists) {
      return null
    }
    return {
      id: doc.id,
      ...doc.data()
    } as Agent
  }

  async findAll(userId?: string): Promise<Agent[]> {
    const adminDb = getAdminDb()
    let query: FirebaseFirestore.Query = adminDb.collection(this.collection)
    
    if (userId) {
      query = query.where('userId', '==', userId)
    }
    
    const snapshot = await query.get()
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Agent))
  }

  async update(id: string, updates: Partial<Agent>): Promise<Agent> {
    const adminDb = getAdminDb()
    const docRef = adminDb.collection(this.collection).doc(id)
    
    // Clean undefined values before updating
    const cleanedUpdates = this.cleanUndefined({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    
    await docRef.update(cleanedUpdates)
    const updated = await docRef.get()
    if (!updated.exists) {
      throw new Error('Agent not found after update')
    }
    return {
      id: updated.id,
      ...updated.data()
    } as Agent
  }

  async delete(id: string): Promise<void> {
    const adminDb = getAdminDb()
    await adminDb.collection(this.collection).doc(id).delete()
  }
}




