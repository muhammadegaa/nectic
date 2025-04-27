import type { Opportunity } from "./opportunities-service"

// AI Service for interacting with Perplexity API through our secure backend

type AnalysisType = "opportunity-analysis" | "vendor-recommendation" | "implementation-guide" | "general-analysis"

// Define the types for AI analysis
export interface AIAnalysisContext {
  user: {
    industry: string
    companySize: string
    role: string
  }
  assessment: {
    scores: {
      documentAutomation: number
      customerServiceAI: number
      dataProcessing: number
      workflowAutomation: number
      overallReadiness: number
    }
    answers: {
      question: string
      answer: string | number | boolean
    }[]
  }
}

export interface AIOpportunity {
  title: string
  description: string
  monthlySavings: number
  timeSavedHours: number
  implementationTimeWeeks: number
  department: string
  complexity: number
  benefits: string[]
  requirements: string[]
  quickWin: boolean
  recommended: boolean
  impactScore: number
}

export interface AIVendor {
  name: string
  type: string
  cost: number
  recommended: boolean
  features: string[]
  pros: string[]
  cons: string[]
  website?: string
  description?: string
}

export interface AIImplementationGuide {
  overview: string
  steps: {
    title: string
    description: string
    duration: string
    keyTasks: string[]
    resources: string[]
  }[]
  risks: {
    title: string
    description: string
    severity: "low" | "medium" | "high"
    mitigation: string
  }[]
  timeline: {
    totalDuration: string
    milestones: {
      title: string
      date: string
    }[]
  }
  resources: {
    title: string
    type: string
    url?: string
    description: string
  }[]
}

interface AIAnalysisRequest {
  query: string
  context?: string
  analysisType: AnalysisType
}

interface AIAnalysisResponse {
  result: string
  model: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Function to call our Perplexity API route with better error handling
async function callPerplexityAPI(prompt: string, model = "mixtral-8x7b-instruct") {
  try {
    console.log("Calling Perplexity API with prompt:", prompt.substring(0, 100) + "...")

    // Check if we're in development/bypass mode and return mock data
    if (process.env.NODE_ENV === "development" && !process.env.PERPLEXITY_API_KEY) {
      console.log("Using mock response in development mode")
      return getMockAIResponse(prompt)
    }

    const response = await fetch("/api/ai/perplexity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        model,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API call failed with status: ${response.status}`, errorText)
      throw new Error(`API call failed with status: ${response.status}`)
    }

    const data = await response.json()
    return data.response
  } catch (error) {
    console.error("Error calling Perplexity API:", error)
    // Return a mock response as fallback
    return getMockAIResponse(prompt)
  }
}

// Mock AI response generator for fallback and development
function getMockAIResponse(prompt: string) {
  // Check what kind of response we need to generate based on the prompt
  if (prompt.includes("identify the top AI implementation opportunities")) {
    return JSON.stringify([
      {
        title: "Document Processing Automation",
        description:
          "Implement AI-powered document processing to automatically extract data from invoices, receipts, and forms.",
        monthlySavings: 3200,
        timeSavedHours: 80,
        implementationTimeWeeks: 6,
        department: "finance",
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
      },
      {
        title: "Customer Service Chatbot",
        description: "Deploy an AI chatbot to handle routine customer inquiries and provide 24/7 support.",
        monthlySavings: 4250,
        timeSavedHours: 120,
        implementationTimeWeeks: 8,
        department: "customer-service",
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
      },
      {
        title: "Automated Data Entry & Validation",
        description: "Implement AI tools to automate data entry from various sources and validate data accuracy.",
        monthlySavings: 2800,
        timeSavedHours: 70,
        implementationTimeWeeks: 4,
        department: "operations",
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
      },
    ])
  } else if (prompt.includes("recommend the best AI vendors")) {
    return JSON.stringify([
      {
        name: "Enterprise AI Solutions",
        type: "Enterprise Solution",
        cost: 2500,
        recommended: true,
        features: [
          "End-to-end implementation",
          "Custom AI model development",
          "Full integration with existing systems",
          "Dedicated support team",
          "Regular updates and improvements",
          "Advanced analytics dashboard",
          "Enterprise-grade security",
        ],
        pros: [
          "Comprehensive solution with minimal internal resources needed",
          "Highest quality and accuracy",
          "Ongoing support and improvements",
          "Scalable for future needs",
        ],
        cons: [
          "Higher cost than alternatives",
          "Longer implementation timeline",
          "May include features you don't need",
        ],
        website: "https://example.com/enterprise-ai",
        description: "A full-service enterprise AI solution provider specializing in business process automation.",
      },
      {
        name: "MidMarket AI",
        type: "Mid-tier Solution",
        cost: 1200,
        recommended: false,
        features: [
          "Pre-built AI models with customization",
          "Standard integrations with popular systems",
          "Email and phone support",
          "Regular updates",
          "Standard security features",
          "Basic analytics",
        ],
        pros: [
          "Good balance of cost and features",
          "Faster implementation than enterprise solutions",
          "Reliable performance for standard use cases",
        ],
        cons: [
          "Limited customization options",
          "May require more internal resources",
          "Basic support compared to enterprise options",
        ],
        website: "https://example.com/midmarket-ai",
        description: "A mid-tier AI solution provider offering a balance of features and affordability.",
      },
    ])
  } else if (prompt.includes("implementation guide")) {
    return JSON.stringify({
      overview:
        "This implementation guide provides a step-by-step approach to successfully implementing this AI solution in your organization.",
      steps: [
        {
          title: "Requirements Analysis",
          description: "Analyze business requirements and current processes to identify integration points.",
          duration: "1-2 weeks",
          keyTasks: [
            "Document current processes",
            "Identify pain points and opportunities",
            "Define success criteria",
            "Identify stakeholders",
          ],
          resources: ["Business analysts", "Department representatives", "Process documentation"],
        },
        {
          title: "Solution Design",
          description: "Design the implementation approach and select appropriate tools and technologies.",
          duration: "1-2 weeks",
          keyTasks: [
            "Evaluate potential solutions",
            "Select technology stack",
            "Design integration architecture",
            "Create implementation plan",
          ],
          resources: ["Solution architects", "IT representatives", "Vendor documentation"],
        },
      ],
      risks: [
        {
          title: "Integration Complexity",
          description: "Existing systems may be more difficult to integrate with than anticipated.",
          severity: "medium",
          mitigation:
            "Conduct thorough analysis of integration points early and allocate additional resources if needed.",
        },
        {
          title: "Data Quality Issues",
          description: "Poor quality data may reduce the effectiveness of the AI solution.",
          severity: "high",
          mitigation: "Implement data validation and cleansing processes before feeding data to the AI system.",
        },
      ],
      timeline: {
        totalDuration: "8 weeks",
        milestones: [
          {
            title: "Project Kickoff",
            date: "Week 1",
          },
          {
            title: "Requirements Finalized",
            date: "Week 2",
          },
        ],
      },
      resources: [
        {
          title: "Implementation Best Practices",
          type: "Article",
          url: "https://example.com/ai-implementation-best-practices",
          description: "A guide to best practices for implementing AI solutions in business environments.",
        },
      ],
    })
  } else {
    // Generic response for other queries
    return "I've analyzed your request and have prepared a detailed response based on industry best practices and current AI capabilities."
  }
}

export async function performAIAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  try {
    // In development/bypass mode, return mock data
    if (process.env.NODE_ENV === "development" && !process.env.PERPLEXITY_API_KEY) {
      console.log("Using mock AI analysis in development mode")
      return {
        result: getMockAIResponse(request.query),
        model: "mock-model",
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      }
    }

    const response = await fetch("/api/ai/perplexity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API call failed with status: ${response.status}`, errorText)
      throw new Error(`API call failed with status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error performing AI analysis:", error)
    // Return mock data as fallback
    return {
      result: getMockAIResponse(request.query),
      model: "mock-model",
      usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300,
      },
    }
  }
}

// General AI analysis function
export async function performAIAnalysisQuery(query: string, context: any = {}): Promise<string> {
  try {
    // Create a prompt for the AI
    const prompt = `
      You are an AI consultant specializing in business automation and AI opportunities.
      
      ${context ? `Context: ${JSON.stringify(context)}` : ""}
      
      Query: ${query}
      
      Provide a detailed and helpful response.
    `

    // Call the Perplexity API
    return await callPerplexityAPI(prompt)
  } catch (error) {
    console.error("Error performing AI analysis:", error)
    return "I apologize, but I encountered an error while analyzing your query. Please try again later."
  }
}

// Function to generate AI opportunities based on assessment results
export async function generateOpportunitiesWithAI(context: AIAnalysisContext): Promise<AIOpportunity[]> {
  try {
    console.log("Generating opportunities with AI for context:", JSON.stringify(context).substring(0, 100) + "...")

    // In development/bypass mode, return mock data immediately
    if (process.env.NODE_ENV === "development" && !process.env.PERPLEXITY_API_KEY) {
      console.log("Using mock opportunities in development mode")
      return getDefaultOpportunities(context.assessment.scores)
    }

    // Create a detailed prompt for the AI
    const prompt = `
      You are an AI consultant specializing in identifying business automation and AI opportunities.
      
      Based on the following assessment data, generate 3-5 specific AI opportunities for this business.
      
      User Information:
      - Industry: ${context.user.industry}
      - Company Size: ${context.user.companySize}
      - Role: ${context.user.role}
      
      Assessment Scores:
      - Document Automation: ${context.assessment.scores.documentAutomation}/100
      - Customer Service AI: ${context.assessment.scores.customerServiceAI}/100
      - Data Processing: ${context.assessment.scores.dataProcessing}/100
      - Workflow Automation: ${context.assessment.scores.workflowAutomation}/100
      - Overall AI Readiness: ${context.assessment.scores.overallReadiness}/100
      
      Assessment Answers:
      ${context.assessment.answers.map((a) => `- Question: ${a.question}\n  Answer: ${a.answer}`).join("\n")}
      
      For each opportunity, provide the following in JSON format:
      - title: A concise title for the opportunity
      - description: A detailed description of the opportunity
      - monthlySavings: Estimated monthly savings in dollars
      - timeSavedHours: Estimated hours saved per month
      - implementationTimeWeeks: Estimated implementation time in weeks
      - department: The department this would benefit most (e.g., "finance", "customer-service", "operations", "hr", "sales", "marketing")
      - complexity: A number from 1-5 indicating implementation complexity
      - benefits: An array of 4-6 specific benefits
      - requirements: An array of 3-5 specific requirements
      - quickWin: Boolean indicating if this is a quick win (low complexity, high impact)
      - recommended: Boolean indicating if this is highly recommended
      - impactScore: A number from 1-100 indicating the potential impact
      
      Return your response as a valid JSON array of opportunities.
    `

    // Call the Perplexity API
    const aiResponse = await callPerplexityAPI(prompt)

    // Parse the JSON response
    // First, find the JSON part of the response (it might be wrapped in markdown code blocks)
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
      aiResponse.match(/```\s*([\s\S]*?)\s*```/) || [null, aiResponse]

    const jsonString = jsonMatch[1] || aiResponse

    // Try to parse the JSON
    try {
      const opportunities = JSON.parse(jsonString)

      // Validate and clean up the opportunities
      return opportunities.map((opp: any) => ({
        title: opp.title || "AI Opportunity",
        description: opp.description || "An AI opportunity for your business",
        monthlySavings: Number(opp.monthlySavings) || 0,
        timeSavedHours: Number(opp.timeSavedHours) || 0,
        implementationTimeWeeks: Number(opp.implementationTimeWeeks) || 4,
        department: opp.department || "operations",
        complexity: Number(opp.complexity) || 3,
        benefits: Array.isArray(opp.benefits) ? opp.benefits : [],
        requirements: Array.isArray(opp.requirements) ? opp.requirements : [],
        quickWin: Boolean(opp.quickWin),
        recommended: Boolean(opp.recommended),
        impactScore: Number(opp.impactScore) || 50,
      }))
    } catch (error) {
      console.error("Error parsing AI response:", error)
      console.log("Raw AI response:", aiResponse)

      // Fall back to default opportunities
      return getDefaultOpportunities(context.assessment.scores)
    }
  } catch (error) {
    console.error("Error generating opportunities with AI:", error)

    // Fall back to default opportunities
    return getDefaultOpportunities(context.assessment.scores)
  }
}

// Rest of the functions remain the same...
// Function to recommend vendors for a specific opportunity
export async function recommendVendorsForOpportunity(opportunity: Opportunity): Promise<AIVendor[]> {
  try {
    // In development/bypass mode, return mock data immediately
    if (process.env.NODE_ENV === "development" && !process.env.PERPLEXITY_API_KEY) {
      console.log("Using mock vendors in development mode")
      return getDefaultVendors(opportunity)
    }

    // Create a detailed prompt for the AI
    const prompt = `
      You are an AI consultant specializing in recommending AI vendors and solutions.
      
      Based on the following opportunity details, recommend 3-5 vendors or solutions that could help implement this AI opportunity.
      
      Opportunity Details:
      - Title: ${opportunity.title || opportunity.name}
      - Description: ${opportunity.description}
      - Department: ${opportunity.department}
      - Implementation Complexity: ${opportunity.complexity}/5
      - Benefits: ${opportunity.benefits.join(", ")}
      - Requirements: ${opportunity.requirements.join(", ")}
      
      For each vendor/solution, provide the following in JSON format:
      - name: The name of the vendor or solution
      - type: The type of solution (e.g., "Enterprise Solution", "Mid-tier Solution", "Starter Solution")
      - cost: Estimated monthly cost in dollars
      - recommended: Boolean indicating if this is the top recommendation
      - features: Array of 5-7 key features
      - pros: Array of 3-4 advantages
      - cons: Array of 2-3 disadvantages
      - website: (Optional) The vendor's website URL
      - description: (Optional) A brief description of the vendor
      
      Return your response as a valid JSON array of vendors.
    `

    // Call the Perplexity API
    const aiResponse = await callPerplexityAPI(prompt)

    // Parse the JSON response
    // First, find the JSON part of the response (it might be wrapped in markdown code blocks)
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
      aiResponse.match(/```\s*([\s\S]*?)\s*```/) || [null, aiResponse]

    const jsonString = jsonMatch[1] || aiResponse

    // Try to parse the JSON
    try {
      const vendors = JSON.parse(jsonString)

      // Validate and clean up the vendors
      return vendors.map((vendor: any) => ({
        name: vendor.name || "AI Solution",
        type: vendor.type || "Solution",
        cost: Number(vendor.cost) || 0,
        recommended: Boolean(vendor.recommended),
        features: Array.isArray(vendor.features) ? vendor.features : [],
        pros: Array.isArray(vendor.pros) ? vendor.pros : [],
        cons: Array.isArray(vendor.cons) ? vendor.cons : [],
        website: vendor.website,
        description: vendor.description,
      }))
    } catch (error) {
      console.error("Error parsing AI response:", error)
      console.log("Raw AI response:", aiResponse)

      // Fall back to default vendors
      return getDefaultVendors(opportunity)
    }
  } catch (error) {
    console.error("Error recommending vendors with AI:", error)

    // Fall back to default vendors
    return getDefaultVendors(opportunity)
  }
}

// Function to generate implementation guide for an opportunity
export async function generateImplementationGuide(opportunity: Opportunity): Promise<AIImplementationGuide> {
  try {
    // In development/bypass mode, return mock data immediately
    if (process.env.NODE_ENV === "development" && !process.env.PERPLEXITY_API_KEY) {
      console.log("Using mock implementation guide in development mode")
      return getDefaultImplementationGuide(opportunity)
    }

    // Create a detailed prompt for the AI
    const prompt = `
      You are an AI consultant specializing in implementation planning for AI and automation projects.
      
      Based on the following opportunity details, create a detailed implementation guide.
      
      Opportunity Details:
      - Title: ${opportunity.title || opportunity.name}
      - Description: ${opportunity.description}
      - Department: ${opportunity.department}
      - Implementation Complexity: ${opportunity.complexity}/5
      - Benefits: ${opportunity.benefits.join(", ")}
      - Requirements: ${opportunity.requirements.join(", ")}
      
      Provide a comprehensive implementation guide in JSON format with the following structure:
      - overview: A high-level summary of the implementation approach
      - steps: An array of implementation steps, each with:
        - title: The step name
        - description: Detailed description of the step
        - duration: Estimated duration (e.g., "2 weeks")
        - keyTasks: Array of specific tasks for this step
        - resources: Array of resources needed for this step
        - risks: An array of potential risks, each with:
        - title: Risk name
        - description: Description of the risk
        - severity: "low", "medium", or "high"
        - mitigation: How to mitigate this risk
        - timeline: Overall timeline information:
        - totalDuration: Total estimated duration (e.g., "12 weeks")
        - milestones: Array of key milestones, each with:
          - title: Milestone name
          - date: Relative timeframe (e.g., "Week 4")
        - resources: Array of helpful resources, each with:
        - title: Resource name
        - type: Type of resource (e.g., "Article", "Tool", "Template")
        - url: (Optional) URL to the resource
        - description: Brief description of the resource
        
        Return your response as a valid JSON object.
        `

    // Call the Perplexity API
    const aiResponse = await callPerplexityAPI(prompt)

    // Parse the JSON response
    // First, find the JSON part of the response (it might be wrapped in markdown code blocks)
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
      aiResponse.match(/```\s*([\s\S]*?)\s*```/) || [null, aiResponse]

    const jsonString = jsonMatch[1] || aiResponse

    // Try to parse the JSON
    try {
      const guide = JSON.parse(jsonString)

      // Validate and return the guide
      return {
        overview: guide.overview || "Implementation guide for " + (opportunity.title || opportunity.name),
        steps: Array.isArray(guide.steps)
          ? guide.steps.map((step: any) => ({
              title: step.title || "Implementation Step",
              description: step.description || "",
              duration: step.duration || "1-2 weeks",
              keyTasks: Array.isArray(step.keyTasks) ? step.keyTasks : [],
              resources: Array.isArray(step.resources) ? step.resources : [],
            }))
          : getDefaultImplementationSteps(),
        risks: Array.isArray(guide.risks)
          ? guide.risks.map((risk: any) => ({
              title: risk.title || "Implementation Risk",
              description: risk.description || "",
              severity: ["low", "medium", "high"].includes(risk.severity) ? risk.severity : "medium",
              mitigation: risk.mitigation || "",
            }))
          : getDefaultRisks(),
        timeline: {
          totalDuration: guide.timeline?.totalDuration || `${opportunity.implementationTimeWeeks} weeks`,
          milestones: Array.isArray(guide.timeline?.milestones) ? guide.timeline.milestones : getDefaultMilestones(),
        },
        resources: Array.isArray(guide.resources)
          ? guide.resources.map((resource: any) => ({
              title: resource.title || "Resource",
              type: resource.type || "Article",
              url: resource.url,
              description: resource.description || "",
            }))
          : getDefaultResources(),
      }
    } catch (error) {
      console.error("Error parsing AI response:", error)
      console.log("Raw AI response:", aiResponse)

      // Fall back to default implementation guide
      return getDefaultImplementationGuide(opportunity)
    }
  } catch (error) {
    console.error("Error generating implementation guide with AI:", error)

    // Fall back to default implementation guide
    return getDefaultImplementationGuide(opportunity)
  }
}

// Default opportunities for fallback
function getDefaultOpportunities(scores: any): AIOpportunity[] {
  const opportunities = []

  // Add document automation opportunity if score is high
  if (scores.documentAutomation > 60) {
    opportunities.push({
      title: "Document Processing Automation",
      description:
        "Implement AI-powered document processing to automatically extract data from invoices, receipts, and forms.",
      monthlySavings: 3200,
      timeSavedHours: 80,
      implementationTimeWeeks: 6,
      department: "finance",
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
    })
  }

  // Add customer service opportunity if score is high
  if (scores.customerServiceAI > 60) {
    opportunities.push({
      title: "Customer Service Chatbot",
      description: "Deploy an AI chatbot to handle routine customer inquiries and provide 24/7 support.",
      monthlySavings: 4250,
      timeSavedHours: 120,
      implementationTimeWeeks: 8,
      department: "customer-service",
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
    })
  }

  // Add data processing opportunity if score is high
  if (scores.dataProcessing > 60) {
    opportunities.push({
      title: "Automated Data Entry & Validation",
      description: "Implement AI tools to automate data entry from various sources and validate data accuracy.",
      monthlySavings: 2800,
      timeSavedHours: 70,
      implementationTimeWeeks: 4,
      department: "operations",
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
    })
  }

  // Always include at least one opportunity
  if (opportunities.length === 0) {
    opportunities.push({
      title: "Email Automation & Classification",
      description:
        "Implement AI to automatically classify, prioritize, and route incoming emails to the right departments.",
      monthlySavings: 2200,
      timeSavedHours: 60,
      implementationTimeWeeks: 4,
      department: "operations",
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
    })
  }

  return opportunities
}

// Default vendors for fallback
function getDefaultVendors(opportunity: Opportunity): AIVendor[] {
  return [
    {
      name: "Enterprise AI Solutions",
      type: "Enterprise Solution",
      cost: 2500,
      recommended: true,
      features: [
        "End-to-end implementation",
        "Custom AI model development",
        "Full integration with existing systems",
        "Dedicated support team",
        "Regular updates and improvements",
        "Advanced analytics dashboard",
        "Enterprise-grade security",
      ],
      pros: [
        "Comprehensive solution with minimal internal resources needed",
        "Highest quality and accuracy",
        "Ongoing support and improvements",
        "Scalable for future needs",
      ],
      cons: ["Higher cost than alternatives", "Longer implementation timeline", "May include features you don't need"],
      website: "https://example.com/enterprise-ai",
      description: "A full-service enterprise AI solution provider specializing in business process automation.",
    },
    {
      name: "MidMarket AI",
      type: "Mid-tier Solution",
      cost: 1200,
      recommended: false,
      features: [
        "Pre-built AI models with customization",
        "Standard integrations with popular systems",
        "Email and phone support",
        "Regular updates",
        "Standard security features",
        "Basic analytics",
      ],
      pros: [
        "Good balance of cost and features",
        "Faster implementation than enterprise solutions",
        "Reliable performance for standard use cases",
      ],
      cons: [
        "Limited customization options",
        "May require more internal resources",
        "Basic support compared to enterprise options",
      ],
      website: "https://example.com/midmarket-ai",
      description: "A mid-tier AI solution provider offering a balance of features and affordability.",
    },
    {
      name: "StartupAI",
      type: "Starter Solution",
      cost: 500,
      recommended: false,
      features: [
        "Basic AI functionality",
        "Self-service implementation",
        "Limited integrations",
        "Community support",
        "Periodic updates",
        "Basic security",
      ],
      pros: ["Most affordable option", "Quick to implement", "Good for testing AI capabilities"],
      cons: [
        "Limited features and customization",
        "Requires more internal resources",
        "May outgrow solution as needs increase",
      ],
      website: "https://example.com/startup-ai",
      description: "An entry-level AI solution for organizations just starting with automation.",
    },
  ]
}

// Default implementation steps for fallback
function getDefaultImplementationSteps() {
  return [
    {
      title: "Requirements Analysis",
      description: "Analyze business requirements and current processes to identify integration points.",
      duration: "1-2 weeks",
      keyTasks: [
        "Document current processes",
        "Identify pain points and opportunities",
        "Define success criteria",
        "Identify stakeholders",
      ],
      resources: ["Business analysts", "Department representatives", "Process documentation"],
    },
    {
      title: "Solution Design",
      description: "Design the implementation approach and select appropriate tools and technologies.",
      duration: "1-2 weeks",
      keyTasks: [
        "Evaluate potential solutions",
        "Select technology stack",
        "Design integration architecture",
        "Create implementation plan",
      ],
      resources: ["Solution architects", "IT representatives", "Vendor documentation"],
    },
    {
      title: "Development & Integration",
      description: "Develop the solution and integrate with existing systems.",
      duration: "2-3 weeks",
      keyTasks: [
        "Configure AI solution",
        "Develop integration components",
        "Set up data flows",
        "Implement security measures",
      ],
      resources: ["Developers", "IT infrastructure team", "Development environments"],
    },
    {
      title: "Testing & Validation",
      description: "Test the solution thoroughly to ensure it meets requirements and performs as expected.",
      duration: "1 week",
      keyTasks: [
        "Develop test cases",
        "Perform functional testing",
        "Validate integration points",
        "Conduct user acceptance testing",
      ],
      resources: ["QA team", "End users", "Test environments"],
    },
  ]
}

// Default risks for fallback
function getDefaultRisks() {
  return [
    {
      title: "Integration Complexity",
      description: "Existing systems may be more difficult to integrate with than anticipated.",
      severity: "medium",
      mitigation: "Conduct thorough analysis of integration points early and allocate additional resources if needed.",
    },
    {
      title: "Data Quality Issues",
      description: "Poor quality data may reduce the effectiveness of the AI solution.",
      severity: "high",
      mitigation: "Implement data validation and cleansing processes before feeding data to the AI system.",
    },
    {
      title: "User Adoption",
      description: "Users may resist adopting the new system or processes.",
      severity: "medium",
      mitigation: "Involve users early in the process, provide comprehensive training, and highlight benefits.",
    },
  ]
}

// Default milestones for fallback
function getDefaultMilestones() {
  return [
    {
      title: "Project Kickoff",
      date: "Week 1",
    },
    {
      title: "Requirements Finalized",
      date: "Week 2",
    },
    {
      title: "Solution Design Approved",
      date: "Week 4",
    },
    {
      title: "Development Complete",
      date: "Week 7",
    },
    {
      title: "Testing Complete",
      date: "Week 8",
    },
    {
      title: "Go-Live",
      date: "Week 9",
    },
  ]
}

// Default resources for fallback
function getDefaultResources() {
  return [
    {
      title: "Implementation Best Practices",
      type: "Article",
      url: "https://example.com/ai-implementation-best-practices",
      description: "A guide to best practices for implementing AI solutions in business environments.",
    },
    {
      title: "Project Plan Template",
      type: "Template",
      url: "https://example.com/ai-project-plan-template",
      description: "A template for planning AI implementation projects.",
    },
    {
      title: "Integration Testing Toolkit",
      type: "Tool",
      url: "https://example.com/integration-testing-toolkit",
      description: "A toolkit for testing integrations between AI systems and existing business systems.",
    },
  ]
}

// Default implementation guide for fallback
function getDefaultImplementationGuide(opportunity: Opportunity): AIImplementationGuide {
  return {
    overview: `Implementation guide for ${opportunity.title || opportunity.name}. This guide provides a step-by-step approach to successfully implementing this AI solution in your organization.`,
    steps: getDefaultImplementationSteps(),
    risks: getDefaultRisks(),
    timeline: {
      totalDuration: `${opportunity.implementationTimeWeeks || 8} weeks`,
      milestones: getDefaultMilestones(),
    },
    resources: getDefaultResources(),
  }
}

// Helper function to format assessment data into a context string
function formatAssessmentContext(assessmentData: any): string {
  let context = "Business Assessment:\n"

  // Add company information
  if (assessmentData.user) {
    context += `Industry: ${assessmentData.user.industry || "Not specified"}\n`
    context += `Company Size: ${assessmentData.user.companySize || "Not specified"}\n`
    context += `Role: ${assessmentData.user.role || "Not specified"}\n\n`
  }

  // Add assessment scores
  if (assessmentData.assessment && assessmentData.assessment.scores) {
    context += "Assessment Scores:\n"
    const scores = assessmentData.assessment.scores
    context += `Document Automation Readiness: ${scores.documentAutomation}/100\n`
    context += `Customer Service AI Readiness: ${scores.customerServiceAI}/100\n`
    context += `Data Processing Readiness: ${scores.dataProcessing}/100\n`
    context += `Workflow Automation Readiness: ${scores.workflowAutomation}/100\n`
    context += `Overall AI Readiness: ${scores.overallReadiness}/100\n\n`
  }

  // Add assessment answers
  if (assessmentData.assessment && assessmentData.assessment.answers) {
    context += "Assessment Answers:\n"
    assessmentData.assessment.answers.forEach((item: any, index: number) => {
      context += `Q: ${item.question}\nA: ${item.answer}\n\n`
    })
  }

  return context
}

// Helper function to parse AI response into structured opportunities
function parseOpportunitiesFromAIResponse(aiResponse: string): any[] {
  try {
    // This is a simplified parser - in production, you might want a more robust solution
    // or have the AI return JSON directly

    // Split the response by opportunity (assuming each starts with a title or number)
    const opportunitySections = aiResponse
      .split(/\n\s*(?:\d+\.\s*|Opportunity\s*\d+:\s*)/i)
      .filter((section) => section.trim().length > 0)

    return opportunitySections.map((section) => {
      // Extract title (first line or sentence)
      const titleMatch = section.match(/^([^.:\n]+)[.:\n]/)
      const title = titleMatch ? titleMatch[1].trim() : "AI Opportunity"

      // Extract description (everything after title until benefits/requirements/etc.)
      const descriptionMatch = section.match(
        /^[^.:\n]+[.:\n]\s*([^]*?)(?:Benefits|Requirements|ROI|Timeline|Complexity|Implementation)/i,
      )
      const description = descriptionMatch ? descriptionMatch[1].trim() : section.substring(0, 200)

      // Extract benefits
      const benefitsMatch = section.match(
        /Benefits[^:]*:\s*([^]*?)(?:Requirements|ROI|Timeline|Complexity|Implementation|$)/i,
      )
      const benefitsText = benefitsMatch ? benefitsMatch[1].trim() : ""
      const benefits = benefitsText
        .split(/\n\s*[-•*]\s*/)
        .filter((b) => b.trim().length > 0)
        .map((b) => b.trim())

      // Extract complexity
      const complexityMatch = section.match(/Complexity[^:]*:\s*([^]*?)(?:\n|$)/i)
      let complexity = 3 // Default medium complexity
      if (complexityMatch) {
        const complexityText = complexityMatch[1].trim()
        // Try to extract a number from the complexity text
        const numberMatch = complexityText.match(/(\d+)/)
        if (numberMatch) {
          complexity = Number.parseInt(numberMatch[1])
          // Ensure it's in range 1-5
          complexity = Math.max(1, Math.min(5, complexity))
        }
      }

      // Extract implementation time
      const timelineMatch = section.match(/(?:Timeline|Implementation Time)[^:]*:\s*([^]*?)(?:\n|$)/i)
      const implementationTime = timelineMatch ? timelineMatch[1].trim() : "4-6 weeks"

      // Extract ROI or savings
      const roiMatch = section.match(/(?:ROI|Savings)[^:]*:\s*([^]*?)(?:\n|$)/i)
      let monthlySavings = 0
      if (roiMatch) {
        const roiText = roiMatch[1].trim()
        // Try to extract a dollar amount
        const dollarMatch = roiText.match(/\$\s*([\d,]+)/)
        if (dollarMatch) {
          monthlySavings = Number.parseInt(dollarMatch[1].replace(/,/g, ""))
        }
      }

      // Determine if it's a quick win based on complexity and implementation time
      const isQuickWin = complexity <= 2 && implementationTime.includes("week")

      return {
        title,
        description,
        monthlySavings: monthlySavings || Math.floor(Math.random() * 3000) + 1000, // Fallback to random value
        timeSaved: `${Math.floor(Math.random() * 80) + 20} hours/month`, // Estimated time saved
        implementationTime,
        complexity,
        benefits: benefits.length > 0 ? benefits : ["Improved efficiency", "Reduced errors", "Cost savings"],
        requirements: ["Integration with existing systems", "Staff training", "Process documentation"],
        quickWin: isQuickWin,
        recommended: true,
        impactScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
        department: determineDepartment(title, description),
        source: "ai-analysis",
      }
    })
  } catch (error) {
    console.error("Error parsing AI response into opportunities:", error)
    // Return a default opportunity as fallback
    return [
      {
        title: "AI-Powered Process Automation",
        description: "Implement AI to automate repetitive tasks and workflows across your organization.",
        monthlySavings: 3000,
        timeSaved: "60 hours/month",
        implementationTime: "4-6 weeks",
        complexity: 3,
        benefits: ["Improved efficiency", "Reduced errors", "Cost savings"],
        requirements: ["Integration with existing systems", "Staff training", "Process documentation"],
        quickWin: false,
        recommended: true,
        impactScore: 85,
        department: "operations",
        source: "ai-analysis",
      },
    ]
  }
}

// Helper function to parse AI response into structured vendor recommendations
function parseVendorsFromAIResponse(aiResponse: string): any[] {
  try {
    // Split the response by vendor (assuming each starts with a vendor name or number)
    const vendorSections = aiResponse
      .split(/\n\s*(?:\d+\.\s*|Vendor\s*\d+:\s*)/i)
      .filter((section) => section.trim().length > 0)

    return vendorSections.map((section) => {
      // Extract vendor name (first line or sentence)
      const nameMatch = section.match(/^([^.:\n]+)[.:\n]/)
      const name = nameMatch ? nameMatch[1].trim() : "AI Vendor"

      // Extract description
      const descriptionMatch = section.match(/^[^.:\n]+[.:\n]\s*([^]*?)(?:Features|Pricing|Pros|Cons|Why)/i)
      const description = descriptionMatch ? descriptionMatch[1].trim() : section.substring(0, 200)

      // Extract features
      const featuresMatch = section.match(/Features[^:]*:\s*([^]*?)(?:Pricing|Pros|Cons|Why|$)/i)
      const featuresText = featuresMatch ? featuresMatch[1].trim() : ""
      const features = featuresText
        .split(/\n\s*[-•*]\s*/)
        .filter((f) => f.trim().length > 0)
        .map((f) => f.trim())

      // Extract pricing
      const pricingMatch = section.match(/Pricing[^:]*:\s*([^]*?)(?:Pros|Cons|Why|$)/i)
      const pricing = pricingMatch ? pricingMatch[1].trim() : "Contact for pricing"

      // Extract pros
      const prosMatch = section.match(/Pros[^:]*:\s*([^]*?)(?:Cons|Why|$)/i)
      const prosText = prosMatch ? prosMatch[1].trim() : ""
      const pros = prosText
        .split(/\n\s*[-•*]\s*/)
        .filter((p) => p.trim().length > 0)
        .map((p) => p.trim())

      // Extract cons
      const consMatch = section.match(/Cons[^:]*:\s*([^]*?)(?:Why|$)/i)
      const consText = consMatch ? consMatch[1].trim() : ""
      const cons = consText // Fixed: consText was used before declaration
        .split(/\n\s*[-•*]\s*/)
        .filter((c) => c.trim().length > 0)
        .map((c) => c.trim())

      return {
        name,
        description,
        features: features.length > 0 ? features : ["AI-powered solution", "Easy integration", "Scalable"],
        pricing,
        pros: pros.length > 0 ? pros : ["Easy to use", "Good customer support", "Comprehensive solution"],
        cons: cons.length > 0 ? cons : ["Learning curve", "May require customization"],
        website: `https://www.${name.toLowerCase().replace(/\s+/g, "")}.com`,
        logo: `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(name.substring(0, 2))}`,
        rating: (Math.floor(Math.random() * 15) + 35) / 10, // Random rating between 3.5-5.0
      }
    })
  } catch (error) {
    console.error("Error parsing AI response into vendors:", error)
    // Return default vendors as fallback
    return [
      {
        name: "AI Solutions Pro",
        description: "Enterprise-grade AI solution with comprehensive features.",
        features: ["AI-powered automation", "Easy integration", "Advanced analytics"],
        pricing: "Starting at $499/month",
        pros: ["Comprehensive solution", "Excellent support", "Regular updates"],
        cons: ["Higher price point", "Complex setup for advanced features"],
        website: "https://www.aisolutionspro.com",
        logo: "/placeholder.svg?height=80&width=80&text=AI",
        rating: 4.7,
      },
      {
        name: "SmartAI",
        description: "User-friendly AI platform for small to medium businesses.",
        features: ["Intuitive interface", "Quick implementation", "Pre-built templates"],
        pricing: "Starting at $199/month",
        pros: ["Easy to use", "Affordable", "Good for beginners"],
        cons: ["Limited customization", "Fewer advanced features"],
        website: "https://www.smartai.com",
        logo: "/placeholder.svg?height=80&width=80&text=SA",
        rating: 4.2,
      },
    ]
  }
}

// Helper function to determine department based on opportunity title and description
function determineDepartment(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase()

  if (text.includes("document") || text.includes("invoice") || text.includes("contract")) {
    return "document-processing"
  } else if (text.includes("customer") || text.includes("support") || text.includes("service")) {
    return "customer-service"
  } else if (text.includes("data") || text.includes("entry") || text.includes("database")) {
    return "data-entry"
  } else if (text.includes("hr") || text.includes("recruit") || text.includes("employee")) {
    return "human-resources"
  } else if (text.includes("sales") || text.includes("marketing") || text.includes("lead")) {
    return "sales-marketing"
  } else if (text.includes("finance") || text.includes("accounting") || text.includes("payment")) {
    return "finance"
  } else {
    return "operations"
  }
}
