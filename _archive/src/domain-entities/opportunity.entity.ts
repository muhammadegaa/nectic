/**
 * Domain Entity: Opportunity
 * Core business entities for AI opportunities
 */

export interface AIOpportunity {
  id: string
  userId: string
  title: string
  description: string
  category: 'document-automation' | 'customer-service' | 'data-processing' | 'workflow-automation'
  monthlySavings: number
  timeSavedHours: number
  impactScore: number // 1-100
  keyBenefits: string[]
  estimatedImplementationTime?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  createdAt: Date
  isPremium: boolean // Requires premium subscription to view full details
}

export interface OpportunityDetails extends AIOpportunity {
  vendorRecommendations?: VendorRecommendation[]
  implementationGuide?: ImplementationGuide
}

export interface VendorRecommendation {
  name: string
  description: string
  pricing: string
  pros: string[]
  cons: string[]
  website: string
  rating?: number
}

export interface ImplementationGuide {
  steps: ImplementationStep[]
  estimatedTime: string
  prerequisites: string[]
}

export interface ImplementationStep {
  order: number
  title: string
  description: string
  estimatedTime: string
}















