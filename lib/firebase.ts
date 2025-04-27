"use client"

// Simple in-memory mock for development
console.log("Using mock Firebase implementation")

// In-memory storage
const mockStorage = {
  users: {},
  opportunities: [],
  assessments: {},
}

// Initialize some opportunities
mockStorage.opportunities = [
  {
    id: "opp1",
    title: "Customer Service Automation",
    description: "Automate responses to common customer inquiries using AI",
    impactScore: 85,
    monthlySavings: 4250,
    timeSaved: "120 hours/month",
    implementationTime: "6-8 weeks",
    department: "customer-service",
    complexity: 3,
    benefits: [
      "Reduce response time by 75%",
      "Handle 60% of inquiries without human intervention",
      "Improve customer satisfaction scores",
      "Free up staff for complex issues",
    ],
    requirements: [
      "Access to customer service email/chat systems",
      "Historical customer inquiry data",
      "Integration with knowledge base",
      "Staff training for AI oversight",
    ],
    recommended: true,
    quickWin: false,
    createdAt: new Date(),
  },
  {
    id: "opp2",
    title: "Document Processing Automation",
    description: "Extract data from financial documents automatically using AI",
    impactScore: 72,
    monthlySavings: 3200,
    timeSaved: "80 hours/month",
    implementationTime: "4-6 weeks",
    department: "finance",
    complexity: 2,
    benefits: [
      "Reduce manual data entry by 90%",
      "Improve data accuracy to 99.5%",
      "Process documents 24/7",
      "Faster financial reporting",
    ],
    requirements: [
      "Access to document repository",
      "Sample documents for training",
      "Integration with accounting system",
      "Process documentation",
    ],
    recommended: true,
    quickWin: true,
    createdAt: new Date(),
  },
]

// Simple timestamp implementation
const mockTimestamp = {
  now: () => ({
    toDate: () => new Date(),
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0,
  }),
  fromDate: (date) => ({
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  }),
}

// Export simplified versions that don't try to mimic Firebase
export const Timestamp = mockTimestamp
export const serverTimestamp = () => mockTimestamp.now()

// Mock Firebase app
const mockApp = {
  name: "nectic-app",
  options: {},
  automaticDataCollectionEnabled: false,
}

// Simplified auth implementation
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    setTimeout(() => callback(null), 0)
    return () => {}
  },
  signInWithEmailAndPassword: async (email, password) => {
    console.log(`Mock sign in with email: ${email}`)
    const userId = `user-${email.replace(/[^a-zA-Z0-9]/g, "-")}`

    // Create user if it doesn't exist
    if (!mockStorage.users[userId]) {
      mockStorage.users[userId] = {
        uid: userId,
        email,
        displayName: email.split("@")[0],
        createdAt: mockTimestamp.now(),
        lastLogin: mockTimestamp.now(),
        systemsConnected: {
          salesforce: false,
          microsoft365: false,
          quickbooks: false,
        },
        subscription: {
          tier: "free",
        },
      }
    }

    return { user: mockStorage.users[userId] }
  },
  createUserWithEmailAndPassword: async (email, password) => {
    console.log(`Mock create user with email: ${email}`)
    const userId = `user-${email.replace(/[^a-zA-Z0-9]/g, "-")}`

    mockStorage.users[userId] = {
      uid: userId,
      email,
      displayName: email.split("@")[0],
      createdAt: mockTimestamp.now(),
      lastLogin: mockTimestamp.now(),
      systemsConnected: {
        salesforce: false,
        microsoft365: false,
        quickbooks: false,
      },
      subscription: {
        tier: "free",
      },
    }

    return { user: mockStorage.users[userId] }
  },
  signInWithPopup: async (provider) => {
    console.log(`Mock sign in with popup`)
    const userId = "google-user"

    if (!mockStorage.users[userId]) {
      mockStorage.users[userId] = {
        uid: userId,
        email: "google-user@example.com",
        displayName: "Google User",
        createdAt: mockTimestamp.now(),
        lastLogin: mockTimestamp.now(),
        systemsConnected: {
          salesforce: false,
          microsoft365: false,
          quickbooks: false,
        },
        subscription: {
          tier: "free",
        },
      }
    }

    return { user: mockStorage.users[userId] }
  },
  signOut: async () => {
    console.log(`Mock sign out`)
  },
  updateProfile: async (user, profile) => {
    if (user && user.uid && mockStorage.users[user.uid]) {
      mockStorage.users[user.uid] = {
        ...mockStorage.users[user.uid],
        ...profile,
      }
    }
  },
}

// Simplified Firestore implementation
const mockDb = {
  // Get a user by ID
  getUser: async (userId) => {
    return mockStorage.users[userId] || null
  },

  // Create or update a user
  setUser: async (userId, userData) => {
    if (!mockStorage.users[userId]) {
      mockStorage.users[userId] = {
        uid: userId,
        ...userData,
      }
    } else {
      mockStorage.users[userId] = {
        ...mockStorage.users[userId],
        ...userData,
      }
    }
    return mockStorage.users[userId]
  },

  // Get opportunities
  getOpportunities: async () => {
    return mockStorage.opportunities
  },

  // Get opportunity by ID
  getOpportunity: async (id) => {
    return mockStorage.opportunities.find((opp) => opp.id === id) || null
  },

  // Get recommended opportunities
  getRecommendedOpportunities: async () => {
    return mockStorage.opportunities.filter((opp) => opp.recommended).slice(0, 3)
  },

  // Save assessment
  saveAssessment: async (userId, assessmentId, data) => {
    if (!mockStorage.assessments[userId]) {
      mockStorage.assessments[userId] = {}
    }
    mockStorage.assessments[userId][assessmentId] = data
    return data
  },

  // Get assessment
  getAssessment: async (userId, assessmentId) => {
    if (!mockStorage.assessments[userId]) {
      return null
    }
    return mockStorage.assessments[userId][assessmentId] || null
  },

  // Add opportunity
  addOpportunity: async (opportunity) => {
    const id = `opp-${Date.now()}`
    const newOpp = { ...opportunity, id }
    mockStorage.opportunities.push(newOpp)
    return newOpp
  },
}

// Mock Google provider
const mockGoogleProvider = {
  addScope: () => {},
}

// Export for compatibility with existing code
export const auth = mockAuth
export const db = mockDb
export const app = mockApp
export const googleProvider = mockGoogleProvider

// Export firebase object for compatibility
export const firebase = {
  app: mockApp,
  auth: mockAuth,
  db: mockDb,
  googleProvider: mockGoogleProvider,
}
