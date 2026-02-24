/**
 * API Route: Submit Assessment
 * Presentation layer - handles HTTP requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { SubmitAssessmentUseCase } from '@/application/use-cases/assessment/submit-assessment.use-case'
import { CalculateAssessmentScoresUseCase } from '@/application/use-cases/assessment/calculate-assessment-scores.use-case'
import { getUserRepository, getAssessmentRepository, getAIService } from '@/infrastructure/di/container'
import { DomainError, ValidationError } from '@/application/errors/domain-errors'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, answers } = body

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: 'Answers are required' },
        { status: 400 }
      )
    }

    // Initialize use cases with dependencies
    const assessmentRepository = getAssessmentRepository()
    const userRepository = getUserRepository()
    const aiService = getAIService()
    const calculateScores = new CalculateAssessmentScoresUseCase()
    const submitAssessment = new SubmitAssessmentUseCase(
      assessmentRepository,
      userRepository,
      calculateScores,
      aiService
    )

    // Execute use case
    const result = await submitAssessment.execute({
      userId,
      answers: answers.map((a: any) => ({
        ...a,
        answeredAt: new Date(a.answeredAt || Date.now()),
      })),
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error submitting assessment:', error)

    if (error instanceof DomainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error instanceof ValidationError ? 400 : 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





