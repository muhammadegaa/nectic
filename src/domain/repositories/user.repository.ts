/**
 * Domain Repository Interface: User
 * Defines contracts for user data operations
 * Implementation lives in infrastructure layer
 */

import { UserProfile, UserPreferences } from '../entities/user.entity'

export interface IUserRepository {
  findById(userId: string): Promise<UserProfile | null>
  findByEmail(email: string): Promise<UserProfile | null>
  create(user: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile>
  update(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>
  updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences>
}















