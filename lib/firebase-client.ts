"use client"

// Simple in-memory mock for development
console.log("Using mock Firebase implementation")

// Simple timestamp implementation
const mockTimestamp = {
  now: () => ({
    toDate: () => new Date(),
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0,
    isEqual: () => false,
    valueOf: () => Date.now(),
  }),
  fromDate: (date) => ({
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  }),
}

// Export simplified versions that don't try to mimic Firebase
export const Timestamp = mockTimestamp

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
    return { user: { uid: "mock-user", email } }
  },
  createUserWithEmailAndPassword: async (email, password) => {
    console.log(`Mock create user with email: ${email}`)
    return { user: { uid: "mock-user", email } }
  },
  signInWithPopup: async (provider) => {
    console.log(`Mock sign in with popup`)
    return { user: { uid: "mock-user", email: "test@example.com" } }
  },
  signOut: async () => {
    console.log(`Mock sign out`)
  },
  updateProfile: async (user, profile) => {
    console.log(`Mock update profile`)
  },
}

// Simplified Firestore implementation
const mockDb = {
  // Get a user by ID
  getUser: async (userId) => {
    return null
  },

  // Create or update a user
  setUser: async (userId, userData) => {
    return null
  },

  // Get opportunities
  getOpportunities: async () => {
    return []
  },

  // Get opportunity by ID
  getOpportunity: async (id) => {
    return null
  },

  // Get recommended opportunities
  getRecommendedOpportunities: async () => {
    return []
  },

  // Save assessment
  saveAssessment: async (userId, assessmentId, data) => {
    return null
  },

  // Get assessment
  getAssessment: async (userId, assessmentId) => {
    return null
  },

  // Add opportunity
  addOpportunity: async (opportunity) => {
    return null
  },
}

// Mock Google provider
const mockGoogleProvider = {
  addScope: () => {},
}

// Export for compatibility with existing code
export const auth = mockAuth
export const db = mockDb
