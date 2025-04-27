import { db, Timestamp } from "./firebase-client"
import { generateOpportunitiesWithAI } from "./ai-service"

// Define the assessment question types
export type QuestionType = "multiple-choice" | "scale" | "numeric" | "boolean"

// Define the assessment question interface
export interface AssessmentQuestion {
  id: string
  text: string
  type: QuestionType
  options?: string[]
  min?: number
  max?: number
  category: "document-processing" | "customer-service" | "data-entry" | "general"
  weight: number // How important this question is for opportunity scoring
}

// Define the assessment answer interface
export interface AssessmentAnswer {
  questionId: string
  value: string | number | boolean
}

// Define the assessment result interface
export interface AssessmentResult {
  userId: string
  answers: AssessmentAnswer[]
  scores: {
    documentAutomation: number
    customerServiceAI: number
    dataProcessing: number
    workflowAutomation: number
    overallReadiness: number
  }
  completedAt: Date
}

// Assessment questions
export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: "doc-volume",
    text: "How many documents (invoices, forms, reports, etc.) does your business process monthly?",
    type: "numeric",
    category: "document-processing",
    weight: 0.8,
  },
  {
    id: "doc-errors",
    text: "What percentage of document processing tasks contain errors that require correction?",
    type: "numeric",
    min: 0,
    max: 100,
    category: "document-processing",
    weight: 0.7,
  },
  {
    id: "doc-time",
    text: "On average, how many hours per week does your team spend on manual document processing?",
    type: "numeric",
    category: "document-processing",
    weight: 0.9,
  },
  {
    id: "cs-volume",
    text: "How many customer inquiries does your business handle monthly?",
    type: "numeric",
    category: "customer-service",
    weight: 0.8,
  },
  {
    id: "cs-repetitive",
    text: "What percentage of customer inquiries are repetitive or frequently asked questions?",
    type: "numeric",
    min: 0,
    max: 100,
    category: "customer-service",
    weight: 0.9,
  },
  {
    id: "cs-response-time",
    text: "What is your average response time to customer inquiries (in hours)?",
    type: "numeric",
    category: "customer-service",
    weight: 0.7,
  },
  {
    id: "data-entry-volume",
    text: "How many hours per week does your team spend on manual data entry tasks?",
    type: "numeric",
    category: "data-entry",
    weight: 0.9,
  },
  {
    id: "data-sources",
    text: "From how many different sources or systems do you regularly need to gather data?",
    type: "numeric",
    category: "data-entry",
    weight: 0.6,
  },
  {
    id: "data-errors",
    text: "What percentage of data entries contain errors that require correction?",
    type: "numeric",
    min: 0,
    max: 100,
    category: "data-entry",
    weight: 0.7,
  },
  {
    id: "process-standardization",
    text: "How standardized are your business processes?",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      "Not standardized at all",
      "Slightly standardized",
      "Moderately standardized",
      "Highly standardized",
      "Completely standardized and documented",
    ],
    category: "general",
    weight: 0.8,
  },
  {
    id: "tech-adoption",
    text: "How would you rate your organization's willingness to adopt new technologies?",
    type: "scale",
    min: 1,
    max: 5,
    options: ["Very resistant", "Somewhat resistant", "Neutral", "Somewhat eager", "Very eager"],
    category: "general",
    weight: 0.7,
  },
  {
    id: "current-ai",
    text: "Is your organization currently using any AI or automation tools?",
    type: "boolean",
    category: "general",
    weight: 0.6,
  },
  {
    id: "decision-speed",
    text: "How quickly can your organization typically implement new technology solutions?",
    type: "multiple-choice",
    options: ["Less than 1 month", "1-3 months", "3-6 months", "6-12 months", "More than 12 months"],
    category: "general",
    weight: 0.5,
  },
  {
    id: "budget",
    text: "What is your estimated monthly budget for AI and automation solutions?",
    type: "multiple-choice",
    options: ["Less than $500", "$500-$2,000", "$2,000-$5,000", "$5,000-$10,000", "More than $10,000"],
    category: "general",
    weight: 0.6,
  },
  {
    id: "pain-points",
    text: "Which business process causes the most frustration or inefficiency in your organization?",
    type: "multiple-choice",
    options: [
      "Document processing",
      "Customer service",
      "Data entry and management",
      "Reporting and analytics",
      "Inventory management",
      "Sales and marketing",
      "Human resources",
      "Other",
    ],
    category: "general",
    weight: 0.8,
  },
]

// In-memory storage for assessments
const assessmentStorage = {
  assessments: {} as Record<string, Record<string, AssessmentResult>>,
}

// Calculate assessment scores based on answers
function calculateScores(answers: AssessmentAnswer[]): AssessmentResult["scores"] {
  // Initialize scores
  const scores = {
    documentAutomation: 0,
    customerServiceAI: 0,
    dataProcessing: 0,
    workflowAutomation: 0,
    overallReadiness: 0,
  }

  // Get questions by ID for easy lookup
  const questionsById = assessmentQuestions.reduce(
    (acc, q) => {
      acc[q.id] = q
      return acc
    },
    {} as Record<string, AssessmentQuestion>,
  )

  // Calculate document automation score
  const docQuestions = assessmentQuestions.filter((q) => q.category === "document-processing")
  let docScore = 0
  let docWeightSum = 0

  docQuestions.forEach((q) => {
    const answer = answers.find((a) => a.questionId === q.id)
    if (answer) {
      // Convert answer to a 0-100 score
      let score = 0
      if (q.id === "doc-volume") {
        // Higher volume = higher score
        const volume = Number(answer.value)
        score = Math.min(100, volume / 10)
      } else if (q.id === "doc-errors") {
        // Higher error rate = higher score (more opportunity)
        score = Number(answer.value)
      } else if (q.id === "doc-time") {
        // More time spent = higher score
        const hours = Number(answer.value)
        score = Math.min(100, hours * 5)
      }

      docScore += score * q.weight
      docWeightSum += q.weight
    }
  })

  scores.documentAutomation = docWeightSum > 0 ? Math.round(docScore / docWeightSum) : 0

  // Calculate customer service AI score
  const csQuestions = assessmentQuestions.filter((q) => q.category === "customer-service")
  let csScore = 0
  let csWeightSum = 0

  csQuestions.forEach((q) => {
    const answer = answers.find((a) => a.questionId === q.id)
    if (answer) {
      // Convert answer to a 0-100 score
      let score = 0
      if (q.id === "cs-volume") {
        // Higher volume = higher score
        const volume = Number(answer.value)
        score = Math.min(100, volume / 100)
      } else if (q.id === "cs-repetitive") {
        // Higher repetitive percentage = higher score
        score = Number(answer.value)
      } else if (q.id === "cs-response-time") {
        // Longer response time = higher score (more opportunity)
        const hours = Number(answer.value)
        score = Math.min(100, hours * 20)
      }

      csScore += score * q.weight
      csWeightSum += q.weight
    }
  })

  scores.customerServiceAI = csWeightSum > 0 ? Math.round(csScore / csWeightSum) : 0

  // Calculate data processing score
  const dataQuestions = assessmentQuestions.filter((q) => q.category === "data-entry")
  let dataScore = 0
  let dataWeightSum = 0

  dataQuestions.forEach((q) => {
    const answer = answers.find((a) => a.questionId === q.id)
    if (answer) {
      // Convert answer to a 0-100 score
      let score = 0
      if (q.id === "data-entry-volume") {
        // More hours = higher score
        const hours = Number(answer.value)
        score = Math.min(100, hours * 5)
      } else if (q.id === "data-sources") {
        // More sources = higher score
        const sources = Number(answer.value)
        score = Math.min(100, sources * 10)
      } else if (q.id === "data-errors") {
        // Higher error rate = higher score
        score = Number(answer.value)
      }

      dataScore += score * q.weight
      dataWeightSum += q.weight
    }
  })

  scores.dataProcessing = dataWeightSum > 0 ? Math.round(dataScore / dataWeightSum) : 0

  // Calculate workflow automation score (based on general questions)
  const generalQuestions = assessmentQuestions.filter((q) => q.category === "general")
  let generalScore = 0
  let generalWeightSum = 0

  generalQuestions.forEach((q) => {
    const answer = answers.find((a) => a.questionId === q.id)
    if (answer) {
      // Convert answer to a 0-100 score
      let score = 0
      if (q.id === "process-standardization") {
        // More standardized = higher score
        score = (Number(answer.value) / 5) * 100
      } else if (q.id === "tech-adoption") {
        // More eager = higher score
        score = (Number(answer.value) / 5) * 100
      } else if (q.id === "current-ai") {
        // Already using AI = lower score (less opportunity)
        score = answer.value === true ? 30 : 70
      } else if (q.id === "decision-speed") {
        // Faster decisions = higher score
        const options = ["Less than 1 month", "1-3 months", "3-6 months", "6-12 months", "More than 12 months"]
        const index = options.indexOf(answer.value as string)
        score = 100 - index * 20 // 100, 80, 60, 40, 20
      } else if (q.id === "budget") {
        // Higher budget = higher score
        const options = ["Less than $500", "$500-$2,000", "$2,000-$5,000", "$5,000-$10,000", "More than $10,000"]
        const index = options.indexOf(answer.value as string)
        score = 20 + index * 20 // 20, 40, 60, 80, 100
      } else if (q.id === "pain-points") {
        // All pain points are equally important
        score = 80 // High opportunity regardless of pain point
      }

      generalScore += score * q.weight
      generalWeightSum += q.weight
    }
  })

  scores.workflowAutomation = generalWeightSum > 0 ? Math.round(generalScore / generalWeightSum) : 0

  // Calculate overall readiness score (average of all scores)
  scores.overallReadiness = Math.round(
    (scores.documentAutomation + scores.customerServiceAI + scores.dataProcessing + scores.workflowAutomation) / 4,
  )

  return scores
}

// Save assessment results to storage
export async function saveAssessmentResults(userId: string, answers: AssessmentAnswer[]): Promise<AssessmentResult> {
  try {
    // Calculate scores
    const scores = calculateScores(answers)

    // Create assessment result
    const result: AssessmentResult = {
      userId,
      answers,
      scores,
      completedAt: new Date(),
    }

    // Initialize user assessments if they don't exist
    if (!assessmentStorage.assessments[userId]) {
      assessmentStorage.assessments[userId] = {}
    }

    // Save to storage
    assessmentStorage.assessments[userId]["latest"] = result

    // Update user document with assessment status
    if (db && db.setUser) {
      await db.setUser(userId, {
        assessment: {
          completedAt: Timestamp.fromDate(result.completedAt),
          scores,
        },
      })
    }

    return result
  } catch (error) {
    console.error("Error saving assessment results:", error)
    throw error
  }
}

// Get assessment results for a user
export async function getAssessmentResults(userId: string): Promise<AssessmentResult | null> {
  try {
    // Check if user has assessments
    if (!assessmentStorage.assessments[userId] || !assessmentStorage.assessments[userId]["latest"]) {
      return null
    }

    return assessmentStorage.assessments[userId]["latest"]
  } catch (error) {
    console.error("Error getting assessment results:", error)
    throw error
  }
}

// Update the generateOpportunitiesFromAssessment function to use our AI service
export async function generateOpportunitiesFromAssessment(userId: string): Promise<void> {
  try {
    // Get assessment results
    const assessment = await getAssessmentResults(userId)

    if (!assessment) {
      throw new Error("No assessment results found")
    }

    // Get user data for additional context
    let userData = null

    if (db && db.getUser) {
      userData = await db.getUser(userId)
    }

    // Prepare context for AI
    const context = {
      user: {
        industry: userData?.industry || "Unknown",
        companySize: userData?.companySize || "Unknown",
        role: userData?.role || "Unknown",
      },
      assessment: {
        scores: assessment.scores,
        answers: assessment.answers.map((answer) => {
          const question = assessmentQuestions.find((q) => q.id === answer.questionId)
          return {
            question: question?.text || "",
            answer: answer.value,
          }
        }),
      },
    }

    // Generate opportunities using AI
    const opportunities = await generateOpportunitiesWithAI(context)

    // Save opportunities to storage
    if (!db.opportunities) {
      db.opportunities = []
    }

    // Add user ID to opportunities
    const userOpportunities = opportunities.map((opp) => ({
      ...opp,
      userId,
      createdAt: new Date(),
      source: "assessment",
    }))

    // Add to opportunities
    db.opportunities = [...db.opportunities, ...userOpportunities]

    // Update user's analysis status
    if (db && db.setUser) {
      await db.setUser(userId, {
        analysis: {
          lastAnalyzedAt: new Date(),
          status: "completed",
          source: "assessment",
        },
      })
    }
  } catch (error) {
    console.error("Error generating opportunities from assessment:", error)
    throw error
  }
}

// Remove the old generateOpportunitiesWithAI function since we now have it in ai-service.ts
// Delete or comment out the old function:
// async function generateOpportunitiesWithAI(context: any): Promise<any[]> { ... }

// Keep the getDefaultOpportunities function as a fallback
// Default opportunities for fallback based on assessment scores
function getDefaultOpportunities(scores: AssessmentResult["scores"]): any[] {
  const opportunities = []

  // Add document automation opportunity if score is high
  if (scores.documentAutomation > 60) {
    opportunities.push({
      title: "Document Processing Automation",
      description:
        "Implement AI-powered document processing to automatically extract data from invoices, receipts, and forms.",
      monthlySavings: 3200,
      timeSaved: "80 hours/month",
      implementationTime: "4-6 weeks",
      complexity: 2,
      benefits: [
        "Reduce manual data entry by 90%",
        "Improve data accuracy to 99.5%",
        "Process documents 24/7",
        "Faster financial reporting",
      ],
      requirements: ["Sample documents for training", "Integration with existing systems", "Process documentation"],
      quickWin: true,
      recommended: true,
      impactScore: 78,
      department: "finance",
    })
  }

  // Add customer service opportunity if score is high
  if (scores.customerServiceAI > 60) {
    opportunities.push({
      title: "Customer Service Chatbot",
      description: "Deploy an AI chatbot to handle routine customer inquiries and provide 24/7 support.",
      monthlySavings: 4250,
      timeSaved: "120 hours/month",
      implementationTime: "6-8 weeks",
      complexity: 3,
      benefits: [
        "Reduce response time by 75%",
        "Handle 60% of inquiries without human intervention",
        "Improve customer satisfaction scores",
        "Free up staff for complex issues",
      ],
      requirements: [
        "FAQ documentation",
        "Integration with website/support channels",
        "Staff training for AI oversight",
      ],
      quickWin: false,
      recommended: true,
      impactScore: 85,
      department: "customer-service",
    })
  }

  // Add data processing opportunity if score is high
  if (scores.dataProcessing > 60) {
    opportunities.push({
      title: "Automated Data Entry & Validation",
      description: "Implement AI tools to automate data entry from various sources and validate data accuracy.",
      monthlySavings: 2800,
      timeSaved: "70 hours/month",
      implementationTime: "3-5 weeks",
      complexity: 2,
      benefits: [
        "Eliminate manual data entry errors",
        "Reduce processing time by 80%",
        "Improve data consistency across systems",
        "Free up staff for higher-value tasks",
      ],
      requirements: ["Access to data sources", "Data validation rules", "Integration with existing databases"],
      quickWin: true,
      recommended: true,
      impactScore: 76,
      department: "operations",
    })
  }

  // Add workflow automation opportunity if score is high
  if (scores.workflowAutomation > 60) {
    opportunities.push({
      title: "Business Process Workflow Automation",
      description: "Implement workflow automation to streamline approval processes and routine business tasks.",
      monthlySavings: 3500,
      timeSaved: "90 hours/month",
      implementationTime: "5-7 weeks",
      complexity: 3,
      benefits: [
        "Reduce process cycle times by 70%",
        "Eliminate bottlenecks in approvals",
        "Improve process visibility and tracking",
        "Ensure consistent process execution",
      ],
      requirements: ["Process documentation", "Stakeholder buy-in", "Integration with existing systems"],
      quickWin: false,
      recommended: true,
      impactScore: 82,
      department: "operations",
    })
  }

  // Always include at least one opportunity
  if (opportunities.length === 0) {
    opportunities.push({
      title: "Email Automation & Classification",
      description:
        "Implement AI to automatically classify, prioritize, and route incoming emails to the right departments.",
      monthlySavings: 2200,
      timeSaved: "60 hours/month",
      implementationTime: "3-4 weeks",
      complexity: 2,
      benefits: [
        "Reduce email processing time by 65%",
        "Ensure critical emails are handled first",
        "Improve response times",
        "Reduce missed communications",
      ],
      requirements: ["Access to email systems", "Classification criteria", "Integration with existing workflow"],
      quickWin: true,
      recommended: true,
      impactScore: 74,
      department: "operations",
    })
  }

  return opportunities
}
