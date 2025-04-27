export interface Opportunity {
  id: string
  title: string
  description: string
  impactScore: number
  monthlySavings: number
  timeSaved: string
  implementationTime: string
  department: string
  complexity: number
  benefits: string[]
  requirements: string[]
  implementationSteps: {
    id: number
    title: string
    duration: string
    description: string
  }[]
  roiAnalysis: {
    costs: {
      setup: number
      license: number
      implementation: number
    }
    savings: {
      monthly: number
      annual: number
      threeYear: number
    }
    paybackPeriod: number
  }
  vendors: {
    id: string
    name: string
    type: string
    features: string[]
    cost: number
    recommended: boolean
  }[]
  recommended: boolean
  quickWin: boolean
}

export interface UserOpportunity {
  id: string
  userId: string
  opportunityId: string
  status: "discovered" | "saved" | "implementing" | "completed"
  progress: number
  notes: string
  createdAt: string
  updatedAt: string
}
