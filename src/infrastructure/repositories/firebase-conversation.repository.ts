/**
 * Infrastructure: Firebase Conversation Repository
 * Handles CRUD operations for conversations and messages
 */

import { getAdminDb } from '../firebase/firebase-server'
import { FieldValue } from 'firebase-admin/firestore'
import type { Conversation, Message } from '@/domain/entities/conversation.entity'

function cleanUndefined(obj: any): any {
  const cleaned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value
    }
  }
  return cleaned
}

export class FirebaseConversationRepository {
  private readonly conversationsCollection = 'conversations'
  private readonly messagesCollection = 'messages'

  private getDb() {
    return getAdminDb()
  }

  /**
   * Create a new conversation
   */
  async create(conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'messageCount'>): Promise<Conversation> {
    const adminDb = this.getDb()
    const now = new Date().toISOString()
    const docRef = adminDb.collection(this.conversationsCollection).doc()
    
    const newConversation = cleanUndefined({
      ...conversation,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    })

    await docRef.set(newConversation)
    return {
      id: docRef.id,
      ...newConversation,
    } as Conversation
  }

  /**
   * Get conversation by ID
   */
  async findById(id: string): Promise<Conversation | null> {
    const adminDb = this.getDb()
    const doc = await adminDb.collection(this.conversationsCollection).doc(id).get()
    if (!doc.exists) {
      return null
    }
    return {
      id: doc.id,
      ...doc.data(),
    } as Conversation
  }

  /**
   * Get all conversations for a user and agent
   */
  async findByAgentAndUser(agentId: string, userId: string, limit: number = 20): Promise<Conversation[]> {
    const adminDb = this.getDb()
    const snapshot = await adminDb
        .collection(this.conversationsCollection)
        .where('agentId', '==', agentId)
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .get()

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Conversation))
  }

  /**
   * Update conversation
   */
  async update(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const adminDb = this.getDb()
    const docRef = adminDb.collection(this.conversationsCollection).doc(id)
    const cleanedUpdates = cleanUndefined({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    await docRef.update(cleanedUpdates)
    const updated = await docRef.get()
    if (!updated.exists) {
      throw new Error('Conversation not found after update')
    }
    return {
      id: updated.id,
      ...updated.data(),
    } as Conversation
  }

  /**
   * Delete conversation
   */
  async delete(id: string): Promise<void> {
    // Delete all messages first
    const adminDb = this.getDb()
    const messagesSnapshot = await adminDb
      .collection(this.messagesCollection)
      .where('conversationId', '==', id)
      .get()
    
    const batch = adminDb.batch()
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    // Delete conversation
    await adminDb.collection(this.conversationsCollection).doc(id).delete()
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(message: Omit<Message, 'id' | 'timestamp'> & { conversationId: string }): Promise<Message> {
    const now = new Date().toISOString()
    const adminDb = this.getDb()
    const docRef = adminDb.collection(this.messagesCollection).doc()
    
    const newMessage = cleanUndefined({
      ...message,
      timestamp: now,
    })

    await docRef.set(newMessage)

    // Update conversation message count and updatedAt
    const conversationRef = adminDb.collection(this.conversationsCollection).doc(message.conversationId)
    await conversationRef.update({
      messageCount: FieldValue.increment(1),
      updatedAt: now,
    })

    return {
      id: docRef.id,
      ...newMessage,
    } as Message
  }

  /**
   * Get all messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    const adminDb = this.getDb()
    const snapshot = await adminDb
      .collection(this.messagesCollection)
      .where('conversationId', '==', conversationId)
      .orderBy('timestamp', 'asc')
      .get()

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Message))
  }

  /**
   * Update message
   */
  async updateMessage(messageId: string, updates: Partial<Message>): Promise<Message> {
    const adminDb = this.getDb()
    const docRef = adminDb.collection(this.messagesCollection).doc(messageId)
    const cleanedUpdates = cleanUndefined(updates)
    await docRef.update(cleanedUpdates)
    const updated = await docRef.get()
    if (!updated.exists) {
      throw new Error('Message not found after update')
    }
    return {
      id: updated.id,
      ...updated.data(),
    } as Message
  }
}

