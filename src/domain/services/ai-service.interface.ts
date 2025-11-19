/**
 * Domain Service Interface: AI Service
 * Defines contract for AI opportunity generation
 * Implementation lives in infrastructure layer
 */

import { AssessmentResult, NLPExtractedData } from '../entities/assessment.entity'
import { AIOpportunity } from '../entities/opportunity.entity'

export interface IAIService {
  generateOpportunitiesFromAssessment(
    assessmentResult: AssessmentResult
  ): Promise<AIOpportunity[]>
  extractStructuredDataFromText(text: string): Promise<NLPExtractedData>
}

