/**
 * Use Case: Calculate Assessment Scores
 * Business logic for scoring assessment answers
 */

import { AssessmentAnswer, AssessmentQuestion, NLPExtractedData } from '@/domain/entities/assessment.entity'
import { AssessmentResultDTO } from '../../dtos/assessment.dto'

export class CalculateAssessmentScoresUseCase {
  execute(
    answers: AssessmentAnswer[],
    questions: AssessmentQuestion[],
    nlpData?: NLPExtractedData
  ): AssessmentResultDTO['scores'] {
    // Map answers to scores
    const answerMap = new Map(answers.map(a => [a.questionId, a.answer]))

    // Initialize scores
    const scores = {
      documentAutomation: 0,
      customerServiceAI: 0,
      dataProcessing: 0,
      workflowAutomation: 0,
    }

    // Score mapping based on question IDs and answers
    answers.forEach(({ questionId, answer }) => {
      const question = questions.find(q => q.id === questionId)
      if (!question) return

      const answerValue = String(answer).toLowerCase()

      // Primary pain point scoring
      if (questionId === 'primary-pain-point') {
        if (answerValue.includes('document') || answerValue.includes('paperwork')) {
          scores.documentAutomation += 40
        }
        if (answerValue.includes('customer') || answerValue.includes('support')) {
          scores.customerServiceAI += 40
        }
        if (answerValue.includes('data') || answerValue.includes('processing')) {
          scores.dataProcessing += 40
        }
        if (answerValue.includes('workflow') || answerValue.includes('process')) {
          scores.workflowAutomation += 40
        }
      }

      // Company size scoring (larger companies = higher scores)
      if (questionId === 'company-size') {
        const sizeMultiplier = answerValue.includes('50+') ? 1.5 : 
                              answerValue.includes('10-50') ? 1.2 : 1.0
        scores.documentAutomation *= sizeMultiplier
        scores.customerServiceAI *= sizeMultiplier
        scores.dataProcessing *= sizeMultiplier
        scores.workflowAutomation *= sizeMultiplier
      }

      // Budget scoring
      if (questionId === 'budget') {
        const budgetScore = answerValue.includes('$10k+') ? 20 :
                           answerValue.includes('$5k') ? 15 :
                           answerValue.includes('$1k') ? 10 : 5
        scores.documentAutomation += budgetScore
        scores.customerServiceAI += budgetScore
        scores.dataProcessing += budgetScore
        scores.workflowAutomation += budgetScore
      }

      // Timeline scoring (sooner = higher priority)
      if (questionId === 'timeline') {
        const timelineScore = answerValue.includes('immediately') ? 15 :
                             answerValue.includes('month') ? 10 : 5
        scores.documentAutomation += timelineScore
        scores.customerServiceAI += timelineScore
        scores.dataProcessing += timelineScore
        scores.workflowAutomation += timelineScore
      }
    })

    // Normalize scores to 0-100 range
    const maxScore = Math.max(...Object.values(scores), 1)
    Object.keys(scores).forEach(key => {
      scores[key as keyof typeof scores] = Math.round(
        (scores[key as keyof typeof scores] / maxScore) * 100
      )
    })

    return scores
  }
}

