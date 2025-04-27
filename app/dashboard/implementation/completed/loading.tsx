export default function Loading() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded mb-6"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="h-5 w-24 bg-gray-200 rounded mb-3"></div>
              <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
              <div className="h-4 w-16 bg-gray-200 rounded mx-auto"></div>
            </div>
          ))}
        </div>

        <div className="border rounded-lg p-4 mb-6">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
