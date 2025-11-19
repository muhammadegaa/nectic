/**
 * Firebase Agent Repository
 */

import { adminDb } from '../firebase/firebase-server'
import type { Agent } from '@/domain/entities/agent.entity'

export class FirebaseAgentRepository {
  private readonly collection = 'agents'

  async create(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    const now = new Date().toISOString()
    const docRef = adminDb.collection(this.collection).doc()
    
    const newAgent: Agent = {
      id: docRef.id,
      ...agent,
      createdAt: now,
      updatedAt: now,
    }

    await docRef.set(newAgent)
    return newAgent
  }

  async findById(id: string): Promise<Agent | null> {
    const doc = await adminDb.collection(this.collection).doc(id).get()
    if (!doc.exists) {
      return null
    }
    return doc.data() as Agent
  }

  async findAll(userId?: string): Promise<Agent[]> {
    let query: FirebaseFirestore.Query = adminDb.collection(this.collection)
    
    if (userId) {
      query = query.where('userId', '==', userId)
    }
    
    const snapshot = await query.get()
    return snapshot.docs.map(doc => doc.data() as Agent)
  }

  async update(id: string, updates: Partial<Agent>): Promise<Agent> {
    const docRef = adminDb.collection(this.collection).doc(id)
    await docRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    const updated = await docRef.get()
    return updated.data() as Agent
  }

  async delete(id: string): Promise<void> {
    await adminDb.collection(this.collection).doc(id).delete()
  }
}




