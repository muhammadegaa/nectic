/**
 * Domain Repository Interface: Assessment
 * Defines contracts for assessment data operations
 */

import { AssessmentResult, AssessmentQuestion } from '../entities/assessment.entity'

export interface IAssessmentRepository {
  saveResult(result: Omit<AssessmentResult, 'id' | 'completedAt'>): Promise<AssessmentResult>
  getResultByUserId(userId: string): Promise<AssessmentResult | null>
  getQuestions(): Promise<AssessmentQuestion[]>
}















