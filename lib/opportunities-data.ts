export interface Opportunity {
  id: string
  title: string
  description: string
  impactScore: number
  monthlySavings: number
  timeSaved: string
  implementationTime: string
  department: string
  implementationEffort: number
  benefits: string[]
  requirements: string[]
  recommended: boolean
  quickWin: boolean
}

export const opportunitiesData: Opportunity[] = [
  {
    id: "opp-1",
    title: "Customer Service Automation",
    description: "Implement AI chatbots to handle common customer inquiries, reducing response time and support costs.",
    impactScore: 85,
    monthlySavings: 12500,
    timeSaved: "320 hours/month",
    implementationTime: "8 weeks",
    department: "customer-service",
    implementationEffort: 3,
    benefits: [
      "Reduce response time by up to 80%",
      "Handle multiple inquiries simultaneously",
      "Provide 24/7 customer support",
      "Free up staff for complex issues",
    ],
    requirements: [
      "Access to customer service systems",
      "Historical customer inquiry data",
      "IT resources for integration",
      "Staff training for handoff scenarios",
    ],
    recommended: true,
    quickWin: false,
  },
  {
    id: "opp-2",
    title: "Document Processing Automation",
    description: "Use AI to extract and process data from financial documents, reducing manual data entry and errors.",
    impactScore: 72,
    monthlySavings: 8200,
    timeSaved: "180 hours/month",
    implementationTime: "6 weeks",
    department: "finance",
    implementationEffort: 2,
    benefits: [
      "Reduce manual data entry by 90%",
      "Improve data accuracy to 99.5%",
      "Process documents 10x faster",
      "Reduce operational costs",
    ],
    requirements: [
      "Access to financial documents",
      "Document processing workflow details",
      "Integration with accounting systems",
      "Staff training for exception handling",
    ],
    recommended: true,
    quickWin: true,
  },
  {
    id: "opp-3",
    title: "Fraud Detection",
    description: "Implement machine learning models to identify suspicious transactions and reduce fraud losses.",
    impactScore: 65,
    monthlySavings: 18500,
    timeSaved: "90 hours/month",
    implementationTime: "12 weeks",
    department: "finance",
    implementationEffort: 4,
    benefits: [
      "Reduce fraud losses by up to 60%",
      "Identify suspicious patterns in real-time",
      "Reduce false positives by 40%",
      "Automate fraud investigation workflows",
    ],
    requirements: [
      "Historical transaction data",
      "Fraud case history",
      "Integration with transaction systems",
      "Compliance team involvement",
    ],
    recommended: true,
    quickWin: false,
  },
]
