/**
 * Domain: Conversation Entity
 * Represents a chat conversation with an agent
 */

export interface Conversation {
  id: string
  agentId: string
  userId: string
  title: string // Auto-generated from first message or user-provided
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface Message {
  id: string
  conversationId?: string // Optional for temporary messages (e.g., welcome message)
  role: 'user' | 'assistant' | 'thinking' // 'thinking' shows AI reasoning steps
  content: string
  timestamp: string
  status?: 'sending' | 'sent' | 'error'
  toolCalls?: Array<{
    tool: string
    args: any
    result?: any
  }>
}

