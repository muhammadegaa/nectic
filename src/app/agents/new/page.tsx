'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AVAILABLE_COLLECTIONS = [
  { id: 'finance_transactions', label: 'Finance Transactions', description: 'Financial transactions data' },
  { id: 'sales_deals', label: 'Sales Deals', description: 'Sales pipeline and deals' },
  { id: 'hr_employees', label: 'HR Employees', description: 'Employee records' },
]

export default function NewAgentPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [intentMappings, setIntentMappings] = useState<Array<{ intent: string; keywords: string; collections: string[] }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCollectionToggle = (collectionId: string) => {
    setSelectedCollections(prev =>
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    )
  }

  const addIntentMapping = () => {
    setIntentMappings(prev => [...prev, { intent: '', keywords: '', collections: [] }])
  }

  const updateIntentMapping = (index: number, field: 'intent' | 'keywords' | 'collections', value: string | string[]) => {
    setIntentMappings(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const removeIntentMapping = (index: number) => {
    setIntentMappings(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || selectedCollections.length === 0) {
      alert('Please provide agent name and select at least one collection')
      return
    }

    setIsSubmitting(true)

    try {
      // Format intent mappings
      const formattedMappings = intentMappings
        .filter(m => m.intent && m.keywords)
        .map(m => ({
          intent: m.intent.trim(),
          keywords: m.keywords.split(',').map(k => k.trim()).filter(Boolean),
          collections: m.collections.length > 0 ? m.collections : selectedCollections,
        }))

      // If no intent mappings, create a default one
      const finalMappings = formattedMappings.length > 0
        ? formattedMappings
        : [{
            intent: 'general',
            keywords: ['all', 'everything', 'data'],
            collections: selectedCollections,
          }]

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          collections: selectedCollections,
          intentMappings: finalMappings,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create agent')
      }

      const agent = await response.json()
      router.push(`/agents/${agent.id}/chat`)
    } catch (error) {
      console.error('Error creating agent:', error)
      alert('Failed to create agent. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New AI Agent</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agent Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Finance Assistant"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What does this agent do?"
              />
            </div>

            {/* Collections */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Collections *
              </label>
              <div className="space-y-2">
                {AVAILABLE_COLLECTIONS.map(collection => (
                  <label key={collection.id} className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(collection.id)}
                      onChange={() => handleCollectionToggle(collection.id)}
                      className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{collection.label}</div>
                      <div className="text-sm text-gray-500">{collection.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Intent Mappings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Intent Mappings (optional)
                </label>
                <button
                  type="button"
                  onClick={addIntentMapping}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Intent
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Map keywords to collections. If not specified, all selected collections will be used.
              </p>

              <div className="space-y-4">
                {intentMappings.map((mapping, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-md bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Intent {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeIntentMapping(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Intent Name
                        </label>
                        <input
                          type="text"
                          value={mapping.intent}
                          onChange={(e) => updateIntentMapping(index, 'intent', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          placeholder="e.g., revenue"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Keywords (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={mapping.keywords}
                          onChange={(e) => updateIntentMapping(index, 'keywords', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          placeholder="e.g., revenue, income, money, earnings"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Collections (leave empty to use all selected)
                        </label>
                        <div className="space-y-1">
                          {selectedCollections.map(colId => {
                            const col = AVAILABLE_COLLECTIONS.find(c => c.id === colId)
                            return (
                              <label key={colId} className="flex items-center text-sm">
                                <input
                                  type="checkbox"
                                  checked={mapping.collections.includes(colId)}
                                  onChange={(e) => {
                                    const newCollections = e.target.checked
                                      ? [...mapping.collections, colId]
                                      : mapping.collections.filter(c => c !== colId)
                                    updateIntentMapping(index, 'collections', newCollections)
                                  }}
                                  className="mr-2 h-3 w-3 text-blue-600"
                                />
                                {col?.label}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || selectedCollections.length === 0}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}




