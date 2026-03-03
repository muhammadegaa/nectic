/**
 * Use Case: Generate Opportunities
 * Orchestrates AI opportunity generation flow
 */

import { IAssessmentRepository } from '@/domain/repositories/assessment.repository'
import { IOpportunityRepository } from '@/domain/repositories/opportunity.repository'
import { IAIService } from '@/domain/services/ai-service.interface'
import { AIOpportunity } from '@/domain/entities/opportunity.entity'

export class GenerateOpportunitiesUseCase {
  constructor(
    private assessmentRepository: IAssessmentRepository,
    private opportunityRepository: IOpportunityRepository,
    private aiService: IAIService
  ) {}

  async execute(userId: string): Promise<AIOpportunity[]> {
    // Get user's assessment result
    const assessmentResult = await this.assessmentRepository.getResultByUserId(userId)
    
    if (!assessmentResult) {
      throw new Error('Assessment not found. Please complete assessment first.')
    }

    // Check if opportunities already exist
    const existingOpportunities = await this.opportunityRepository.findByUserId(userId)
    if (existingOpportunities.length > 0) {
      // Delete existing opportunities to regenerate
      await this.opportunityRepository.deleteByUserId(userId)
    }

    // Generate opportunities using AI service
    const opportunities = await this.aiService.generateOpportunitiesFromAssessment(
      assessmentResult
    )

    // Save opportunities
    const savedOpportunities = await this.opportunityRepository.saveMany(
      opportunities.map(opp => ({
        ...opp,
        userId,
      }))
    )

    return savedOpportunities
  }
}















