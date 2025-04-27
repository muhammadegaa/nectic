import { db } from "@/lib/firebase-client"

export interface Opportunity {
  id: string
  name: string
  title?: string
  description: string
  impactScore: number
  monthlySavings: number
  timeSavedHours: number
  implementationTimeWeeks: number
  department: string
  complexity: number
  implementationEffort: number
  benefits: string[]
  requirements: string[]
  recommended: boolean
  quickWin: boolean
  createdAt: Date
  implementationSteps?: any[] // Optional for compatibility
  roiAnalysis?: any // Optional for compatibility
  vendors?: any[] // Optional for compatibility
}

// Enhanced mock opportunities data with more entries
const mockOpportunities: Opportunity[] = [
  {
    id: "opp1",
    name: "Automate responses to common customer inquiries using AI",
    description:
      "Implement an AI chatbot system that can automatically respond to common customer inquiries, reducing response time and freeing up customer service representatives for more complex issues.",
    impactScore: 85,
    monthlySavings: 4250,
    timeSavedHours: 120,
    implementationTimeWeeks: 6,
    department: "customer-service",
    complexity: 3,
    implementationEffort: 4,
    benefits: [
      "Reduce response time by 75%",
      "Handle 60% of inquiries without human intervention",
      "Improve customer satisfaction scores",
      "Free up staff for complex issues",
    ],
    requirements: ["FAQ documentation", "Integration with website/support channels", "Staff training for AI oversight"],
    recommended: true,
    quickWin: false,
    createdAt: new Date(),
  },
  {
    id: "opp2",
    name: "Extract data from financial documents automatically using AI",
    description:
      "Implement AI-powered document processing to automatically extract data from invoices, receipts, and forms, reducing manual data entry and improving accuracy.",
    impactScore: 72,
    monthlySavings: 3200,
    timeSavedHours: 80,
    implementationTimeWeeks: 5,
    department: "finance",
    complexity: 3,
    implementationEffort: 3,
    benefits: [
      "Reduce manual data entry by 90%",
      "Improve data accuracy to 99.5%",
      "Process documents 24/7",
      "Faster financial reporting",
    ],
    requirements: ["Sample documents for training", "Integration with existing systems", "Process documentation"],
    recommended: true,
    quickWin: true,
    createdAt: new Date(),
  },
  {
    id: "opp3",
    name: "Identify suspicious transactions with machine learning",
    description:
      "Implement a machine learning system to identify potentially fraudulent transactions based on historical patterns and anomaly detection.",
    impactScore: 65,
    monthlySavings: 5800,
    timeSavedHours: 60,
    implementationTimeWeeks: 8,
    department: "finance",
    complexity: 4,
    implementationEffort: 5,
    benefits: [
      "Reduce fraud losses by up to 60%",
      "Automate suspicious transaction flagging",
      "Reduce false positives by 40%",
      "Improve compliance reporting",
    ],
    requirements: [
      "Historical transaction data",
      "Integration with transaction systems",
      "Compliance review and approval",
    ],
    recommended: true,
    quickWin: false,
    createdAt: new Date(),
  },
  {
    id: "opp4",
    name: "Optimize inventory levels with predictive analytics",
    description:
      "Use AI to predict inventory needs based on historical sales data, seasonality, and market trends to optimize stock levels.",
    impactScore: 78,
    monthlySavings: 3800,
    timeSavedHours: 45,
    implementationTimeWeeks: 3,
    department: "operations",
    complexity: 2,
    implementationEffort: 2,
    benefits: [
      "Reduce excess inventory by 25%",
      "Decrease stockouts by 40%",
      "Lower warehouse costs",
      "Improve cash flow",
    ],
    requirements: ["Sales and inventory history", "Integration with inventory management system", "Staff training"],
    recommended: true,
    quickWin: true,
    createdAt: new Date(),
  },
  {
    id: "opp5",
    name: "Streamline employee onboarding with AI assistants",
    description:
      "Implement AI assistants to guide new hires through the onboarding process, answer common questions, and provide access to necessary resources.",
    impactScore: 62,
    monthlySavings: 2200,
    timeSavedHours: 30,
    implementationTimeWeeks: 4,
    department: "hr",
    complexity: 2,
    implementationEffort: 3,
    benefits: [
      "Reduce onboarding time by 30%",
      "Improve new hire satisfaction",
      "Ensure consistent information delivery",
      "Free up HR resources",
    ],
    requirements: ["Onboarding documentation", "Integration with HR systems", "Process redesign"],
    recommended: false,
    quickWin: true,
    createdAt: new Date(),
  },
  {
    id: "opp6",
    name: "Automate data entry from sales calls with AI transcription",
    description:
      "Use AI to transcribe sales calls and automatically update CRM with key information, action items, and follow-ups.",
    impactScore: 70,
    monthlySavings: 2800,
    timeSavedHours: 65,
    implementationTimeWeeks: 3,
    department: "sales",
    complexity: 2,
    implementationEffort: 2,
    benefits: [
      "Save 5-10 hours per salesperson monthly",
      "Improve data accuracy in CRM",
      "Capture more sales insights",
      "Better follow-up rates",
    ],
    requirements: ["Call recording system", "CRM integration", "Sales process documentation"],
    recommended: true,
    quickWin: true,
    createdAt: new Date(),
  },
  {
    id: "opp7",
    name: "Implement predictive maintenance for manufacturing equipment",
    description:
      "Use IoT sensors and AI to predict equipment failures before they occur, reducing downtime and maintenance costs.",
    impactScore: 85,
    monthlySavings: 7500,
    timeSavedHours: 40,
    implementationTimeWeeks: 10,
    department: "operations",
    complexity: 5,
    implementationEffort: 5,
    benefits: [
      "Reduce unplanned downtime by 45%",
      "Lower maintenance costs by 30%",
      "Extend equipment lifespan",
      "Optimize maintenance scheduling",
    ],
    requirements: [
      "IoT sensors installation",
      "Historical maintenance data",
      "Integration with CMMS",
      "Staff training",
    ],
    recommended: true,
    quickWin: false,
    createdAt: new Date(),
  },
  {
    id: "opp8",
    name: "Personalize customer communications with AI",
    description:
      "Use AI to analyze customer behavior and preferences to deliver personalized communications and offers.",
    impactScore: 75,
    monthlySavings: 3500,
    timeSavedHours: 50,
    implementationTimeWeeks: 4,
    department: "customer-service",
    complexity: 3,
    implementationEffort: 3,
    benefits: [
      "Increase response rates by 25%",
      "Improve customer satisfaction",
      "Boost conversion rates",
      "Enhance customer loyalty",
    ],
    requirements: ["Customer data integration", "Marketing automation platform", "Content templates"],
    recommended: false,
    quickWin: true,
    createdAt: new Date(),
  },
]

// Add mock data to the db if it doesn't exist
if (!db.opportunities) {
  db.opportunities = mockOpportunities
}

export async function getOpportunities(userId: string): Promise<Opportunity[]> {
  try {
    // In a real app, we would filter by userId
    // For now, return all mock opportunities
    return Promise.resolve([...mockOpportunities])
  } catch (error) {
    console.error("Error fetching opportunities:", error)
    return []
  }
}

// Update the getOpportunityById function to properly handle the opportunity ID
export async function getOpportunityById(id: string, userId: string): Promise<Opportunity | null> {
  try {
    // Ensure id is a string
    const opportunityId = String(id)

    // Find the opportunity in our mock data
    const opportunity = mockOpportunities.find((opp) => opp.id === opportunityId)

    // Add console logging for debugging
    console.log(`Looking for opportunity with ID: ${opportunityId}`)
    console.log(`Found opportunity:`, opportunity)

    return Promise.resolve(opportunity || null)
  } catch (error) {
    console.error(`Error fetching opportunity ${id}:`, error)
    return null
  }
}

export async function getRecommendedOpportunities(userId: string): Promise<Opportunity[]> {
  try {
    // Return opportunities marked as recommended
    const recommended = mockOpportunities.filter((opp) => opp.recommended)
    return Promise.resolve([...recommended])
  } catch (error) {
    console.error("Error getting recommended opportunities:", error)
    return []
  }
}

export async function getQuickWinOpportunities(userId: string): Promise<Opportunity[]> {
  try {
    // Return opportunities marked as quick wins
    const quickWins = mockOpportunities.filter((opp) => opp.quickWin)
    return Promise.resolve([...quickWins])
  } catch (error) {
    console.error("Error getting quick win opportunities:", error)
    return []
  }
}

// New function to update opportunity
export async function updateOpportunity(
  opportunityId: string,
  updates: Partial<Opportunity>,
): Promise<Opportunity | null> {
  try {
    // Find the opportunity to update
    const index = mockOpportunities.findIndex((opp) => opp.id === opportunityId)

    if (index === -1) {
      return null
    }

    // Update the opportunity
    const updatedOpportunity = {
      ...mockOpportunities[index],
      ...updates,
    }

    // In a real app, we would update the database
    // For now, update our mock data
    mockOpportunities[index] = updatedOpportunity

    return Promise.resolve(updatedOpportunity)
  } catch (error) {
    console.error(`Error updating opportunity ${opportunityId}:`, error)
    return null
  }
}

// Mock implementation projects
export const mockProjects = [
  {
    id: "proj1",
    title: "Customer Service Automation",
    description: "Implementing AI chatbots to handle common customer inquiries",
    status: "in-progress",
    progress: 65,
    startDate: "2025-03-15",
    estimatedCompletion: "2025-05-01",
    team: ["John Doe", "Sarah Smith", "Mike Johnson"],
    tasks: [
      {
        id: "task1",
        title: "Requirements gathering",
        status: "completed",
        dueDate: "2025-03-22",
        assignee: "John Doe",
      },
      { id: "task2", title: "Vendor selection", status: "completed", dueDate: "2025-03-29", assignee: "Sarah Smith" },
      { id: "task3", title: "Initial setup", status: "completed", dueDate: "2025-04-05", assignee: "Mike Johnson" },
      {
        id: "task4",
        title: "Integration with existing systems",
        status: "in-progress",
        dueDate: "2025-04-15",
        assignee: "John Doe",
      },
      {
        id: "task5",
        title: "Testing and validation",
        status: "not-started",
        dueDate: "2025-04-22",
        assignee: "Sarah Smith",
      },
      { id: "task6", title: "Staff training", status: "not-started", dueDate: "2025-04-29", assignee: "Mike Johnson" },
    ],
    risks: [
      {
        id: "risk1",
        title: "Integration complexity",
        severity: "medium",
        mitigation: "Additional technical resources",
      },
      { id: "risk2", title: "User adoption", severity: "low", mitigation: "Comprehensive training program" },
    ],
    updates: [
      {
        id: "update1",
        date: "2025-04-01",
        author: "John Doe",
        content:
          "Integration with the CRM system is taking longer than expected due to API limitations. Working with the vendor to find a solution.",
      },
      {
        id: "update2",
        date: "2025-03-25",
        author: "Sarah Smith",
        content: "Vendor selection completed. We've chosen ChatBot Pro as our solution provider.",
      },
      {
        id: "update3",
        date: "2025-03-18",
        author: "Mike Johnson",
        content: "Requirements gathering phase completed. Moving on to vendor selection.",
      },
    ],
    documents: [
      { id: "doc1", name: "Requirements Document", type: "pdf", uploadedBy: "John Doe", uploadDate: "2025-03-18" },
      { id: "doc2", name: "Vendor Comparison", type: "xlsx", uploadedBy: "Sarah Smith", uploadDate: "2025-03-25" },
      { id: "doc3", name: "Implementation Plan", type: "docx", uploadedBy: "Mike Johnson", uploadDate: "2025-03-30" },
    ],
  },
  {
    id: "proj2",
    title: "Document Processing Automation",
    description: "Implementing AI for automated data extraction from financial documents",
    status: "planning",
    progress: 25,
    startDate: "2025-04-01",
    estimatedCompletion: "2025-05-15",
    team: ["Emily Chen", "David Wilson"],
    tasks: [
      {
        id: "task1",
        title: "Requirements gathering",
        status: "completed",
        dueDate: "2025-04-08",
        assignee: "Emily Chen",
      },
      {
        id: "task2",
        title: "Vendor evaluation",
        status: "in-progress",
        dueDate: "2025-04-15",
        assignee: "David Wilson",
      },
      {
        id: "task3",
        title: "Solution selection",
        status: "not-started",
        dueDate: "2025-04-22",
        assignee: "Emily Chen",
      },
      {
        id: "task4",
        title: "Implementation planning",
        status: "not-started",
        dueDate: "2025-04-29",
        assignee: "David Wilson",
      },
    ],
    risks: [
      { id: "risk1", title: "Document variety", severity: "high", mitigation: "Comprehensive document analysis" },
      { id: "risk2", title: "Data accuracy", severity: "medium", mitigation: "Validation workflows" },
    ],
    updates: [
      {
        id: "update1",
        date: "2025-04-05",
        author: "Emily Chen",
        content:
          "Requirements gathering phase completed. We've identified 12 different document types that need to be processed.",
      },
      {
        id: "update2",
        date: "2025-04-02",
        author: "David Wilson",
        content: "Project kickoff meeting held. Team roles and responsibilities assigned.",
      },
    ],
    documents: [
      { id: "doc1", name: "Document Types Analysis", type: "pdf", uploadedBy: "Emily Chen", uploadDate: "2025-04-05" },
      { id: "doc2", name: "Project Charter", type: "docx", uploadedBy: "David Wilson", uploadDate: "2025-04-02" },
    ],
  },
  {
    id: "proj3",
    title: "Sales Forecasting AI",
    description: "Implementing predictive analytics for sales forecasting",
    status: "on-hold",
    progress: 40,
    startDate: "2025-02-15",
    estimatedCompletion: "2025-04-30",
    team: ["Robert Taylor", "Lisa Brown"],
    tasks: [
      { id: "task1", title: "Data collection", status: "completed", dueDate: "2025-02-28", assignee: "Robert Taylor" },
      { id: "task2", title: "Model development", status: "in-progress", dueDate: "2025-03-15", assignee: "Lisa Brown" },
      {
        id: "task3",
        title: "Integration planning",
        status: "not-started",
        dueDate: "2025-03-30",
        assignee: "Robert Taylor",
      },
      { id: "task4", title: "User testing", status: "not-started", dueDate: "2025-04-15", assignee: "Lisa Brown" },
    ],
    risks: [
      { id: "risk1", title: "Data quality", severity: "high", mitigation: "Data cleansing procedures" },
      { id: "risk2", title: "Model accuracy", severity: "medium", mitigation: "Regular model retraining" },
    ],
    updates: [
      {
        id: "update1",
        date: "2025-03-10",
        author: "Lisa Brown",
        content: "Project put on hold due to resource constraints. Expected to resume in 2 weeks.",
      },
      {
        id: "update2",
        date: "2025-03-01",
        author: "Robert Taylor",
        content: "Data collection phase completed. Moving on to model development.",
      },
    ],
    documents: [
      {
        id: "doc1",
        name: "Data Collection Report",
        type: "pdf",
        uploadedBy: "Robert Taylor",
        uploadDate: "2025-03-01",
      },
      { id: "doc2", name: "Model Specifications", type: "docx", uploadedBy: "Lisa Brown", uploadDate: "2025-03-05" },
    ],
  },
]

// Function to get all projects
export async function getProjects(): Promise<any[]> {
  return Promise.resolve([...mockProjects])
}

// Function to get a project by id
export async function getProjectById(id: string): Promise<any | null> {
  const project = mockProjects.find((p) => p.id === id)
  return Promise.resolve(project || null)
}

// Function to update a project
export async function updateProject(projectId: string, updates: any): Promise<any | null> {
  try {
    const index = mockProjects.findIndex((p) => p.id === projectId)

    if (index === -1) {
      return null
    }

    const updatedProject = {
      ...mockProjects[index],
      ...updates,
    }

    mockProjects[index] = updatedProject

    return Promise.resolve(updatedProject)
  } catch (error) {
    console.error(`Error updating project ${projectId}:`, error)
    return null
  }
}
