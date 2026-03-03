/**
 * Domain Repository Interface: Opportunity
 * Defines contracts for opportunity data operations
 */

import { AIOpportunity, OpportunityDetails } from '../entities/opportunity.entity'

export interface IOpportunityRepository {
  save(opportunity: Omit<AIOpportunity, 'id' | 'createdAt'>): Promise<AIOpportunity>
  saveMany(opportunities: Omit<AIOpportunity, 'id' | 'createdAt'>[]): Promise<AIOpportunity[]>
  findByUserId(userId: string): Promise<AIOpportunity[]>
  findById(opportunityId: string): Promise<OpportunityDetails | null>
  deleteByUserId(userId: string): Promise<void>
}















