import { collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase-client"

// Sample opportunity data
export const opportunitiesData = [
  {
    title: "Customer Service Automation",
    description: "Implement AI chatbots to handle common customer inquiries, reducing response time and support costs.",
    impactScore: 85,
    monthlySavings: 12500,
    timeSaved: "320 hours/month",
    implementationTime: "8 weeks",
    department: "customer-service",
    complexity: 3,
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
    industries: ["general", "financial-services", "retail", "healthcare"],
    createdAt: Timestamp.now(),
  },
  {
    title: "Document Processing Automation",
    description: "Use AI to extract and process data from financial documents, reducing manual data entry and errors.",
    impactScore: 72,
    monthlySavings: 8200,
    timeSaved: "180 hours/month",
    implementationTime: "6 weeks",
    department: "finance",
    complexity: 2,
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
    industries: ["general", "financial-services", "insurance", "healthcare"],
    createdAt: Timestamp.now(),
  },
  {
    title: "Fraud Detection",
    description: "Implement machine learning models to identify suspicious transactions and reduce fraud losses.",
    impactScore: 65,
    monthlySavings: 18500,
    timeSaved: "90 hours/month",
    implementationTime: "12 weeks",
    department: "finance",
    complexity: 4,
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
    industries: ["financial-services", "insurance", "retail"],
    createdAt: Timestamp.now(),
  },
  {
    title: "Meeting Summarization",
    description: "Automatically generate summaries from meeting recordings to save time and improve documentation.",
    impactScore: 48,
    monthlySavings: 5200,
    timeSaved: "120 hours/month",
    implementationTime: "4 weeks",
    department: "operations",
    complexity: 1,
    benefits: [
      "Eliminate manual note-taking",
      "Create searchable meeting archives",
      "Improve knowledge sharing",
      "Reduce meeting follow-up time",
    ],
    requirements: [
      "Meeting recording system",
      "Audio quality standards",
      "Integration with communication tools",
      "User training",
    ],
    recommended: false,
    quickWin: true,
    industries: ["general", "technology", "financial-services", "healthcare"],
    createdAt: Timestamp.now(),
  },
  {
    title: "Sales Forecasting",
    description: "Use AI to predict sales trends and optimize inventory management based on historical data.",
    impactScore: 68,
    monthlySavings: 9800,
    timeSaved: "60 hours/month",
    implementationTime: "8 weeks",
    department: "sales",
    complexity: 3,
    benefits: [
      "Improve forecast accuracy by 35%",
      "Reduce excess inventory costs",
      "Optimize sales team resource allocation",
      "Identify emerging market trends",
    ],
    requirements: [
      "Historical sales data (minimum 12 months)",
      "Current inventory management system access",
      "Sales team buy-in and training",
      "Regular data quality reviews",
    ],
    recommended: false,
    quickWin: false,
    industries: ["retail", "manufacturing", "technology"],
    createdAt: Timestamp.now(),
  },
]

// Client-side function to seed opportunities
export async function seedOpportunities() {
  try {
    const batch = []

    for (const opportunity of opportunitiesData) {
      batch.push(addDoc(collection(db, "opportunities"), opportunity))
    }

    await Promise.all(batch)
    console.log(`Added ${opportunitiesData.length} opportunities to Firestore`)
    return true
  } catch (error) {
    console.error("Error seeding data:", error)
    return false
  }
}
