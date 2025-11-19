'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Agent } from '@/domain/entities/agent.entity'

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      if (!response.ok) throw new Error('Failed to fetch agents')
      const data = await response.json()
      setAgents(data)
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
          <Link
            href="/agents/new"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            + New Agent
          </Link>
        </div>

        {agents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No agents yet</p>
            <Link
              href="/agents/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first agent →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}/chat`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{agent.name}</h3>
                {agent.description && (
                  <p className="text-gray-600 text-sm mb-4">{agent.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {agent.collections.map(collection => (
                    <span
                      key={collection}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {collection.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  Chat with agent →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}




