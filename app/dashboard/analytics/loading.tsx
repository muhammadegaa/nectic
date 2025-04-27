export default function Loading() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 w-40 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded mb-6"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border rounded-lg p-4">
            <div className="h-5 w-48 bg-gray-200 rounded mb-3"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="h-5 w-48 bg-gray-200 rounded mb-3"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>

        <div className="border rounded-lg p-4 mb-6">
          <div className="h-5 w-48 bg-gray-200 rounded mb-3"></div>
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
      </div>
    </div>
  )
}
