import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">Nectic</h1>
        <p className="text-xl text-gray-600 mb-8">AI Agents for Enterprise Data</p>
        <p className="text-gray-500 mb-12">Create AI agents that connect to your data and answer questions in natural language</p>
        
        <div className="flex gap-4 justify-center">
          <Link
            href="/agents/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Create New Agent
          </Link>
          <Link
            href="/agents"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            View Agents
          </Link>
        </div>
      </div>
    </main>
  )
}









