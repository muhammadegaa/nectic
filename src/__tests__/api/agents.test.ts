import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, GET } from '@/app/api/agents/route'
import { NextRequest } from 'next/server'

// Mock Firebase Admin
vi.mock('@/infrastructure/firebase/firebase-server', () => ({
  getAdminAuth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-user-id' }),
  }),
}))

// Mock Firebase Agent Repository
vi.mock('@/infrastructure/repositories/firebase-agent.repository', () => ({
  FirebaseAgentRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({
      id: 'test-agent-id',
      name: 'Test Agent',
      userId: 'test-user-id',
    }),
    findAll: vi.fn().mockResolvedValue([
      { id: 'agent-1', name: 'Agent 1', userId: 'test-user-id' },
    ]),
  })),
}))

describe('Agents API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/agents', () => {
    it('should require authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Agent',
          collections: ['test-collection'],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should require name and collections', async () => {
      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should create agent with valid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Agent',
          collections: ['test-collection'],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('name', 'Test Agent')
    })
  })

  describe('GET /api/agents', () => {
    it('should require authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/agents')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should return user agents when authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/agents', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })
  })
})

