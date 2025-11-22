/**
 * Firebase Agent Repository
 */

import { getAdminDb } from '../firebase/firebase-server'
import { encryptDatabaseConnection, decryptDatabaseConnection } from '@/lib/encryption'
import type { Agent } from '@/domain/entities/agent.entity'

export class FirebaseAgentRepository {
  private readonly collection = 'agents'

  async create(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    const adminDb = getAdminDb()
    const now = new Date().toISOString()
    const docRef = adminDb.collection(this.collection).doc()
    
    // Encrypt database connection credentials if present
    let processedAgent = { ...agent }
    if (processedAgent.databaseConnection) {
      processedAgent.databaseConnection = encryptDatabaseConnection(processedAgent.databaseConnection)
    }
    
    // Clean undefined values (Firestore doesn't allow undefined)
    const cleanedAgent = this.cleanUndefined({
      ...processedAgent,
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
    const data = doc.data() as any
    // Decrypt database connection if present
    if (data.databaseConnection) {
      data.databaseConnection = decryptDatabaseConnection(data.databaseConnection)
    }
    return {
      ...data,
      id: doc.id,
    } as Agent
  }

  async findAll(userId?: string): Promise<Agent[]> {
    const adminDb = getAdminDb()
    let query: FirebaseFirestore.Query = adminDb.collection(this.collection)
    
    if (userId) {
      query = query.where('userId', '==', userId)
    }
    
    const snapshot = await query.get()
    return snapshot.docs.map(doc => {
      const data = doc.data() as Agent
      // Decrypt database connection if present
      if (data.databaseConnection) {
        data.databaseConnection = decryptDatabaseConnection(data.databaseConnection)
      }
      return {
        ...data,
        id: doc.id,
      } as Agent
    })
  }

  async update(id: string, updates: Partial<Agent>): Promise<Agent> {
    const adminDb = getAdminDb()
    const docRef = adminDb.collection(this.collection).doc(id)
    
    // Encrypt database connection if present in updates
    let processedUpdates = { ...updates }
    if (processedUpdates.databaseConnection) {
      processedUpdates.databaseConnection = encryptDatabaseConnection(processedUpdates.databaseConnection)
    }
    
    // Clean undefined values before updating
    const cleanedUpdates = this.cleanUndefined({
      ...processedUpdates,
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




