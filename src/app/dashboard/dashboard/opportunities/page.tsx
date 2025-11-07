"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getOpportunities, type Opportunity } from "@/lib/opportunities-service"
import { OpportunityCard } from "@/components/opportunity-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Filter, Download, ArrowDownUp, Grid3X3, Table } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function OpportunitiesPage() {
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [department, setDepartment] = useState<string>("all")
  const [sort, setSort] = useState<string>("impact")
  const [view, setView] = useState<"grid" | "table">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    async function loadOpportunities() {
      if (!user) return

      try {
        setLoading(true)
        const data = await getOpportunities(user.uid)
        setOpportunities(data as any)
        setFilteredOpportunities(data as any)
      } catch (err) {
        console.error("Failed to load opportunities:", err)
        setError("Failed to load opportunities. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadOpportunities()
  }, [user])

  // Filter and sort opportunities when filter criteria change
  useEffect(() => {
    if (!opportunities.length) return

    let filtered = [...opportunities]

    // Filter by department
    if (department !== "all") {
      filtered = filtered.filter((opp) => opp.department === department)
    }

    // Filter by tab (category)
    if (activeTab === "recommended") {
      filtered = filtered.filter((opp) => opp.recommended)
    } else if (activeTab === "quick-wins") {
      filtered = filtered.filter((opp) => opp.quickWin)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (opp) => opp.name.toLowerCase().includes(query) || opp.description.toLowerCase().includes(query),
      )
    }

    // Sort opportunities
    filtered.sort((a, b) => {
      switch (sort) {
        case "impact":
          return b.impactScore - a.impactScore
        case "savings":
          return b.monthlySavings - a.monthlySavings
        case "time":
          return a.implementationTimeWeeks - b.implementationTimeWeeks
        case "complexity":
          return a.complexity - b.complexity
        default:
          return b.impactScore - a.impactScore
      }
    })

    setFilteredOpportunities(filtered)
  }, [department, sort, searchQuery, activeTab, opportunities])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-md mt-12">
        <CardHeader>
          <CardTitle>Error Loading Opportunities</CardTitle>
          <CardDescription>We encountered a problem loading your AI opportunities</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  // Department options
  const departments = [
    { value: "all", label: "All Departments" },
    { value: "customer-service", label: "Customer Service" },
    { value: "finance", label: "Finance" },
    { value: "sales", label: "Sales" },
    { value: "operations", label: "Operations" },
    { value: "hr", label: "HR & Talent" },
  ]

  // Sort options
  const sortOptions = [
    { value: "impact", label: "Highest Impact" },
    { value: "savings", label: "Highest Savings" },
    { value: "time", label: "Quickest Implementation" },
    { value: "complexity", label: "Lowest Complexity" },
  ]

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Opportunities</h1>
          <p className="text-muted-foreground">
            Discover and implement AI solutions to improve efficiency and reduce costs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className={isMobile ? "w-full" : "w-[180px]"}>
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={isMobile ? "w-full" : ""}>
                <ArrowDownUp className="mr-2 h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={sort === option.value}
                  onCheckedChange={() => setSort(option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex rounded-md border bg-background">
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 ${view === "grid" ? "bg-muted" : ""}`}
              onClick={() => setView("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 ${view === "table" ? "bg-muted" : ""}`}
              onClick={() => setView("table")}
            >
              <Table className="h-4 w-4" />
              <span className="sr-only">Table view</span>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start md:justify-center mb-4">
          <TabsTrigger value="all">All Opportunities</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="quick-wins">Quick Wins</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredOpportunities.length === 0 ? (
            <div className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">No opportunities found</h2>
              <p className="text-gray-500">Try adjusting your filters or search criteria to see more results.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-amber-100 text-amber-800 px-3 py-1">
                  {filteredOpportunities.length} opportunities
                </Badge>
                {searchQuery && <p className="text-sm text-gray-500">Results for "{searchQuery}"</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOpportunities.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="space-y-4">
          {filteredOpportunities.length === 0 ? (
            <div className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">No recommended opportunities found</h2>
              <p className="text-gray-500">Try adjusting your filters or search criteria to see more results.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-amber-100 text-amber-800 px-3 py-1">
                  {filteredOpportunities.length} recommended opportunities
                </Badge>
                <p className="text-sm text-gray-500">Based on your business assessment</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOpportunities.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="quick-wins" className="space-y-4">
          {filteredOpportunities.length === 0 ? (
            <div className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">No quick win opportunities found</h2>
              <p className="text-gray-500">Try adjusting your filters or search criteria to see more results.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-green-100 text-green-800 px-3 py-1">
                  {filteredOpportunities.length} quick win opportunities
                </Badge>
                <p className="text-sm text-gray-500">Opportunities that can be implemented quickly</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOpportunities.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
