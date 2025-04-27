import { Badge } from "@/components/ui/badge"

export function PricingHeader() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <div className="space-y-2 max-w-3xl">
        <Badge variant="outline" className="mb-2 bg-white">
          <span className="text-primary animate-pulse">🔥 Current Pricing</span>
        </Badge>
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Subscription Plans</h2>
        <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
          Choose the plan that best fits your business needs
        </p>
        {/* The misleading text has been removed */}
      </div>
    </div>
  )
}
