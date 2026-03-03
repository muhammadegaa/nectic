/**
 * Application DTOs: Opportunity
 * Data Transfer Objects for opportunity operations
 */

export interface OpportunityListDTO {
  id: string
  title: string
  description: string
  category: string
  monthlySavings: number
  timeSavedHours: number
  impactScore: number
  keyBenefits: string[]
  isPremium: boolean
}

export interface OpportunityDetailDTO extends OpportunityListDTO {
  estimatedImplementationTime?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  vendorRecommendations?: Array<{
    name: string
    description: string
    pricing: string
    pros: string[]
    cons: string[]
    website: string
    rating?: number
  }>
  implementationGuide?: {
    steps: Array<{
      order: number
      title: string
      description: string
      estimatedTime: string
    }>
    estimatedTime: string
    prerequisites: string[]
  }
}















