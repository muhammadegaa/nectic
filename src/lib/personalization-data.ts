// Mock data for personalization features
export const companyData = {
  name: "FinServe Solutions",
  logo: "/company-logo.svg", // This would be a real logo in production
  industry: "Financial Services",
  employees: 350,
  aiReadinessScore: 68,
  systemsConnected: ["Salesforce", "Microsoft 365", "QuickBooks", "DocuSign"],
  documentTypes: {
    "loan-applications": {
      name: "Loan Applications",
      count: 4320,
      period: "last quarter",
      processingTime: 18, // minutes per document
    },
    "customer-onboarding": {
      name: "Customer Onboarding Forms",
      count: 1250,
      period: "last quarter",
      processingTime: 24, // minutes per document
    },
    "compliance-reports": {
      name: "Compliance Reports",
      count: 380,
      period: "last quarter",
      processingTime: 45, // minutes per document
    },
  },
  currentProcessMetrics: {
    manualDataEntryHours: 215,
    documentProcessingTime: 22, // minutes average
    errorRate: 4.2, // percentage
    complianceDelays: 8, // days average
    customerWaitTime: 3.5, // days average
  },
  industryBenchmarks: {
    documentProcessingTime: 18, // minutes average
    errorRate: 3.1, // percentage
    complianceDelays: 5, // days average
    customerWaitTime: 2.8, // days average
    aiAdoptionRate: 42, // percentage
  },
  userProfile: {
    name: "Alex",
    role: "Director of Operations",
    department: "Operations",
    recentActivity: ["Viewed Customer Service Automation", "Connected DocuSign", "Completed AI Readiness Assessment"],
  },
}

// Get document-specific data for an opportunity
export function getDocumentDataForOpportunity(opportunityId: string) {
  // In a real app, this would match specific document types to opportunities
  // For now, we'll use a simple mapping
  const mappings = {
    "opp-1": "customer-onboarding",
    "opp-2": "loan-applications",
    "opp-3": "compliance-reports",
    "opp-4": "loan-applications",
    "opp-5": "customer-onboarding",
    "opp-6": "compliance-reports",
    "opp-7": "customer-onboarding",
    "opp-8": "loan-applications",
    "opp-9": "compliance-reports",
    "opp-10": "customer-onboarding",
    "opp-11": "compliance-reports",
    "opp-12": "loan-applications",
  }

  const docTypeKey = opportunityId as keyof typeof mappings
  const docType = mappings[docTypeKey] || "loan-applications"
  const docTypeMapped = docType as keyof typeof companyData.documentTypes
  return companyData.documentTypes[docTypeMapped]
}

// Get personalized description for an opportunity
export function getPersonalizedDescription(opportunityId: string, baseDescription: string) {
  const docData = getDocumentDataForOpportunity(opportunityId)
  const systemsUsed = companyData.systemsConnected.slice(0, 2).join(" and ")

  // In a real app, these would be much more sophisticated and tailored
  const personalizations = {
    "opp-1": `Based on your ${systemsUsed} data, we've identified that your customer service team could automate responses to common inquiries. We detected ${docData.count.toLocaleString()} ${docData.name.toLowerCase()} processed ${docData.period} that contained repetitive information requests.`,
    "opp-2": `After analyzing your ${systemsUsed}, we found that your team manually processes ${docData.count.toLocaleString()} ${docData.name.toLowerCase()} ${docData.period}. Each document takes approximately ${docData.processingTime} minutes to process, with data being re-entered across multiple systems.`,
    "opp-3": `Your ${companyData.industry} compliance requirements are particularly stringent. Based on your ${systemsUsed} data, we identified ${docData.count.toLocaleString()} ${docData.name.toLowerCase()} that could benefit from automated fraud detection, potentially reducing your current ${companyData.currentProcessMetrics.errorRate}% error rate.`,
  }

  const personalizationKey = opportunityId as keyof typeof personalizations
  return personalizations[personalizationKey] || baseDescription
}

// Get workflow steps for an opportunity
export function getWorkflowSteps(opportunityId: string) {
  // In a real app, these would be extracted from actual system data
  const workflows = {
    "opp-1": [
      { name: "Receive inquiry", time: 5, automated: false },
      { name: "Categorize request", time: 8, automated: false },
      { name: "Search knowledge base", time: 12, automated: false },
      { name: "Draft response", time: 15, automated: false },
      { name: "Send response", time: 2, automated: true },
    ],
    "opp-2": [
      { name: "Receive document", time: 2, automated: true },
      { name: "Extract data", time: 14, automated: false },
      { name: "Validate information", time: 8, automated: false },
      { name: "Enter into system", time: 12, automated: false },
      { name: "Process approval", time: 10, automated: false },
    ],
    "opp-3": [
      { name: "Transaction logged", time: 1, automated: true },
      { name: "Manual review", time: 18, automated: false },
      { name: "Flag suspicious patterns", time: 12, automated: false },
      { name: "Investigate alerts", time: 25, automated: false },
      { name: "Document findings", time: 15, automated: false },
    ],
  }

  const workflowKey = opportunityId as keyof typeof workflows
  return workflows[workflowKey] || workflows["opp-2"]
}

// Get improved workflow steps (after AI implementation)
export function getImprovedWorkflowSteps(opportunityId: string) {
  const currentSteps = getWorkflowSteps(opportunityId)

  // Transform the current steps to show improvements
  return currentSteps.map((step) => {
    // In a real app, this would be more sophisticated
    if (!step.automated) {
      return {
        ...step,
        automated: true,
        time: Math.round(step.time * 0.3), // 70% time reduction
        improved: true,
      }
    }
    return step
  })
}
