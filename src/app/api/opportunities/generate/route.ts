/**
 * API Route: Generate Opportunities
 * Presentation layer - handles HTTP requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { GenerateOpportunitiesUseCase } from '@/application/use-cases/opportunity/generate-opportunities.use-case'
import { getAssessmentRepository, getOpportunityRepository, getAIService } from '@/infrastructure/di/container'
import { DomainError } from '@/application/errors/domain-errors'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Initialize use case with dependencies
    const assessmentRepository = getAssessmentRepository()
    const opportunityRepository = getOpportunityRepository()
    const aiService = getAIService()
    
    const generateOpportunities = new GenerateOpportunitiesUseCase(
      assessmentRepository,
      opportunityRepository,
      aiService
    )

    // Execute use case
    const opportunities = await generateOpportunities.execute(userId)

    return NextResponse.json({ opportunities }, { status: 201 })
  } catch (error) {
    console.error('Error generating opportunities:', error)

    if (error instanceof DomainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





