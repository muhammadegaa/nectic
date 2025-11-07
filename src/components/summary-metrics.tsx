import { DollarSign, Clock, Gauge } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface SummaryMetricsProps {
  totalSavings: number
  implementationEffort: number
  aiReadinessScore: number
}

export function SummaryMetrics({ totalSavings, implementationEffort, aiReadinessScore }: SummaryMetricsProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get readiness level text
  const getReadinessLevel = (score: number) => {
    if (score < 40) return "Low"
    if (score < 70) return "Medium"
    return "High"
  }

  // Get readiness color
  const getReadinessColor = (score: number) => {
    if (score < 40) return "text-red-500"
    if (score < 70) return "text-amber-500"
    return "text-green-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="mr-2 rounded-full bg-green-100 p-1">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm font-medium">Total Monthly Savings</span>
            </div>
            <span className="text-xl font-bold">{formatCurrency(totalSavings)}</span>
          </div>
          <p className="text-xs text-muted-foreground">Potential monthly cost reduction across all opportunities</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="mr-2 rounded-full bg-amber-100 p-1">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-sm font-medium">Implementation Effort</span>
            </div>
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-6 mx-0.5 rounded-sm ${
                    i < Math.round(implementationEffort) ? "bg-amber-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Average complexity level for implementation</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="mr-2 rounded-full bg-blue-100 p-1">
                <Gauge className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium">AI Readiness Score</span>
            </div>
            <span className={`text-xl font-bold ${getReadinessColor(aiReadinessScore)}`}>
              {getReadinessLevel(aiReadinessScore)}
            </span>
          </div>
          <Progress value={aiReadinessScore} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">Your organization's readiness to implement AI solutions</p>
        </div>
      </CardContent>
    </Card>
  )
}
