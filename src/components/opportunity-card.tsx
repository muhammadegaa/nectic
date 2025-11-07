import { Clock, DollarSign, Calendar, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Opportunity } from "@/lib/opportunities-service"

interface OpportunityCardProps {
  opportunity: Opportunity
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Progress indicator color based on complexity
  const getComplexityColor = (complexity: number) => {
    if (complexity <= 2) return "bg-green-500"
    if (complexity <= 4) return "bg-amber-500"
    return "bg-red-500"
  }

  // Get implementation effort text
  const getEffortText = (effort: number) => {
    if (effort <= 2) return "Easy"
    if (effort <= 4) return "Medium"
    return "Complex"
  }

  // Get implementation effort badge color
  const getEffortBadgeClass = (effort: number) => {
    if (effort <= 2) return "bg-green-100 text-green-800 hover:bg-green-200"
    if (effort <= 4) return "bg-amber-100 text-amber-800 hover:bg-amber-200"
    return "bg-red-100 text-red-800 hover:bg-red-200"
  }

  return (
    <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-md overflow-hidden">
      <CardHeader className="pb-3 relative">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {opportunity.recommended && (
                <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
                  Recommended
                </Badge>
              )}
              {opportunity.quickWin && (
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                  Quick Win
                </Badge>
              )}
              <Badge className={getEffortBadgeClass(opportunity.implementationEffort)}>
                {getEffortText(opportunity.implementationEffort)}
              </Badge>
            </div>
            <CardTitle className="text-lg line-clamp-2">{opportunity.name}</CardTitle>
          </div>
          <div className="h-14 w-14 rounded-full bg-amber-50 flex-shrink-0 flex items-center justify-center">
            <div className="text-xl font-bold text-amber-800">{opportunity.impactScore}%</div>
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-2">{opportunity.description}</CardDescription>
      </CardHeader>

      <CardContent className="pb-4 flex-grow">
        <div className="space-y-3 text-sm mb-2">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div className="w-full">
              <div className="text-sm text-muted-foreground mb-1">Monthly Savings</div>
              <div className="font-medium">{formatCurrency(opportunity.monthlySavings)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <div className="w-full">
              <div className="text-sm text-muted-foreground mb-1">Time Saved</div>
              <div className="font-medium">{opportunity.timeSavedHours} hrs/month</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-amber-600" />
            <div className="w-full">
              <div className="text-sm text-muted-foreground mb-1">Implementation Time</div>
              <div className="font-medium">{opportunity.implementationTimeWeeks} weeks</div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm text-muted-foreground mb-1">Implementation Complexity</div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${getComplexityColor(opportunity.complexity)} rounded-full`}
              style={{ width: `${(opportunity.complexity / 5) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <div>Simple</div>
            <div>Complex</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button className="w-full bg-amber-500 hover:bg-amber-600 transition-all duration-200" asChild>
          <Link href={`/app/opportunities/${opportunity.id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
