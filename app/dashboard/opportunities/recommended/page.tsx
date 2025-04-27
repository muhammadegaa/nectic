"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Filter, ArrowUpDown, Lightbulb } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { OpportunityCard } from "@/components/opportunity-card"
import { useAuth } from "@/contexts/auth-context"
import { getRecommendedOpportunities } from "@/lib/opportunities-service"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { Opportunity } from "@/lib/opportunities-data"

export default function RecommendedOpportunitiesPage() {
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("impact")
  const [filterBy, setFilterBy] = useState("all")
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true)
        if (!user) return

        const data = await getRecommendedOpportunities(user.uid)
        setOpportunities(data)
      } catch (error) {
        console.error("Error fetching opportunities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOpportunities()
  }, [user])

  // Filter and sort opportunities
  const filteredOpportunities = opportunities
    .filter(
      (opportunity) =>
        (filterBy === "all" || opportunity.department === filterBy) &&
        (opportunity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opportunity.description.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => {
      if (sortBy === "impact") {
        return b.impactScore - a.impactScore
      } else if (sortBy === "effort") {
        return a.complexity - b.complexity
      } else if (sortBy === "roi") {
        return b.impactScore / b.complexity - a.impactScore / a.complexity
      }
      return 0
    })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Recommended Opportunities</h1>
          <p className="text-gray-500">AI opportunities tailored to your business needs</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <a href="/assessment">Run New Assessment</a>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search opportunities..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className={isMobile ? "w-full" : "w-[180px]"}>
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>Filter</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="customer-service">Customer Service</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className={isMobile ? "w-full" : "w-[180px]"}>
              <div className="flex items-center">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span>Sort</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="impact">Highest Impact</SelectItem>
              <SelectItem value="effort">Lowest Effort</SelectItem>
              <SelectItem value="roi">Best ROI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredOpportunities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="rounded-full bg-amber-100 p-3 mb-4">
              <Lightbulb className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchQuery
                ? `No opportunities matching "${searchQuery}" were found.`
                : "We don't have any recommended opportunities for you yet. Try running a new assessment."}
            </p>
            <Button className="mt-4" asChild>
              <a href="/assessment">Run New Assessment</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-amber-100 text-amber-800 px-3 py-1">Recommended for you</Badge>
            <p className="text-sm text-gray-500">Based on your business assessment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
