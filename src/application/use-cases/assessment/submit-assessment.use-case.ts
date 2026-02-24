/**
 * Use Case: Submit Assessment
 * Orchestrates assessment submission flow
 */

import { IAssessmentRepository } from '@/domain/repositories/assessment.repository'
import { IUserRepository } from '@/domain/repositories/user.repository'
import { IAIService } from '@/domain/services/ai-service.interface'
import { AssessmentResult } from '@/domain/entities/assessment.entity'
import { SubmitAssessmentDTO, AssessmentResultDTO } from '../../dtos/assessment.dto'
import { CalculateAssessmentScoresUseCase } from './calculate-assessment-scores.use-case'

export class SubmitAssessmentUseCase {
  constructor(
    private assessmentRepository: IAssessmentRepository,
    private userRepository: IUserRepository,
    private calculateScores: CalculateAssessmentScoresUseCase,
    private aiService: IAIService
  ) {}

  async execute(dto: SubmitAssessmentDTO): Promise<AssessmentResultDTO> {
    // Get questions for scoring
    const questions = await this.assessmentRepository.getQuestions()

    // Extract NLP data from free text input if provided
    const textInputAnswer = dto.answers.find(
      a => a.questionId === 'pain-point-description' && typeof a.answer === 'string' && a.answer.trim().length > 0
    )
    
    let nlpExtractedData = undefined
    if (textInputAnswer && typeof textInputAnswer.answer === 'string') {
      try {
        // Use NLP to extract structured data from free text
        nlpExtractedData = await this.aiService.extractStructuredDataFromText(textInputAnswer.answer)
      } catch (error) {
        console.error('Error extracting NLP data:', error)
        // Continue without NLP data if extraction fails
      }
    }

    // Calculate scores (will use NLP data if available)
    const scores = this.calculateScores.execute(dto.answers, questions, nlpExtractedData)

    // Extract primary pain point (prefer NLP-extracted if available)
    const primaryPainPointAnswer = dto.answers.find(
      a => a.questionId === 'primary-pain-point'
    )
    const primaryPainPoint = nlpExtractedData?.primaryPainPoint || 
      (primaryPainPointAnswer ? String(primaryPainPointAnswer.answer) : undefined)

    // Save assessment result
    const result = await this.assessmentRepository.saveResult({
      userId: dto.userId,
      answers: dto.answers,
      scores,
      primaryPainPoint,
      nlpExtractedData,
    })

    // Update user profile
    await this.userRepository.update(dto.userId, {
      hasCompletedAssessment: true,
    })

    return {
      id: result.id,
      scores: result.scores,
      primaryPainPoint: result.primaryPainPoint,
      completedAt: result.completedAt,
    }
  }
}

