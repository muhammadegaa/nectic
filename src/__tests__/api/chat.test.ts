import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/infrastructure/firebase/firebase-server', () => ({
  getAdminAuth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-user-id' }),
  }),
  getAdminDb: vi.fn(),
}))

vi.mock('@/infrastructure/repositories/firebase-agent.repository', () => ({
  FirebaseAgentRepository: vi.fn().mockImplementation(() => ({
    findById: vi.fn().mockResolvedValue({
      id: 'test-agent-id',
      name: 'Test Agent',
      collections: ['test-collection'],
    }),
  })),
}))

vi.mock('@/infrastructure/repositories/firebase-conversation.repository', () => ({
  FirebaseConversationRepository: vi.fn().mockImplementation(() => ({
    getMessages: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: 'conv-id' }),
    addMessage: vi.fn(),
  })),
}))

vi.mock('@/lib/llm-client', () => ({
  callLLM: vi.fn().mockResolvedValue({
    response: 'Test response',
    reasoning: [],
  }),
}))

describe('Chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  it('should require authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'test-agent-id',
        message: 'Hello',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Unauthorized')
  })

  it('should require agentId and message', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
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

  it('should return 404 if agent not found', async () => {
    const { FirebaseAgentRepository } = await import('@/infrastructure/repositories/firebase-agent.repository')
    const mockRepo = new (FirebaseAgentRepository as any)()
    vi.mocked(mockRepo.findById).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: 'non-existent',
        message: 'Hello',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('not found')
  })
})

