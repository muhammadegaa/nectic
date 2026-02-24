/**
 * Application DTOs: Assessment
 * Data Transfer Objects for assessment operations
 */

import { AssessmentAnswer, AssessmentQuestion } from '@/domain/entities/assessment.entity'

export interface SubmitAssessmentDTO {
  userId: string
  answers: AssessmentAnswer[]
}

export interface AssessmentQuestionDTO {
  id: string
  text: string
  type: 'multiple-choice' | 'text' | 'number'
  options?: string[]
  required: boolean
  showIf?: {
    questionId: string
    answer: string | string[]
  }
}

export interface AssessmentResultDTO {
  id: string
  scores: {
    documentAutomation: number
    customerServiceAI: number
    dataProcessing: number
    workflowAutomation: number
  }
  primaryPainPoint?: string
  completedAt: Date
}















