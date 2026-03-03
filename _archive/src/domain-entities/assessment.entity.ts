/**
 * Domain Entity: Assessment
 * Core business entities for assessment flow
 */

export interface AssessmentQuestion {
  id: string
  text: string
  type: 'multiple-choice' | 'text' | 'number'
  options?: string[]
  required: boolean
  showIf?: {
    questionId: string
    answer: string | string[]
  }
  category: 'pain-point' | 'company-info' | 'budget' | 'timeline' | 'conditional'
}

export interface AssessmentAnswer {
  questionId: string
  answer: string | number
  answeredAt: Date
}

export interface NLPExtractedData {
  primaryPainPoint?: string
  [key: string]: any
}

export interface AssessmentResult {
  id: string
  userId: string
  answers: AssessmentAnswer[]
  scores: {
    documentAutomation: number
    customerServiceAI: number
    dataProcessing: number
    workflowAutomation: number
  }
  completedAt: Date
  primaryPainPoint?: string
  nlpExtractedData?: NLPExtractedData
}

