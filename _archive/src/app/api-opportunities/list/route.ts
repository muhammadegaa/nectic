/**
 * API Route: List Opportunities
 * Presentation layer - handles HTTP requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOpportunityRepository } from '@/infrastructure/di/container'
import { OpportunityListDTO } from '@/application/dtos/opportunity.dto'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const opportunityRepository = getOpportunityRepository()
    const opportunities = await opportunityRepository.findByUserId(userId)

    // Map to DTO
    const dto: OpportunityListDTO[] = opportunities.map(opp => ({
      id: opp.id,
      title: opp.title,
      description: opp.description,
      category: opp.category,
      monthlySavings: opp.monthlySavings,
      timeSavedHours: opp.timeSavedHours,
      impactScore: opp.impactScore,
      keyBenefits: opp.keyBenefits,
      isPremium: opp.isPremium,
    }))

    return NextResponse.json({ opportunities: dto })
  } catch (error) {
    console.error('Error listing opportunities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





