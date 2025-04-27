"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, Download, ExternalLink, Filter, Heart, Search, SortAsc, SortDesc, Star } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface VendorFeature {
  id: string
  name: string
}

interface Vendor {
  id: string
  name: string
  description: string
  priceRange: string
  rating: number
  features: Record<string, boolean | string>
}

interface VendorComparisonProps {
  vendors: Vendor[]
  features: VendorFeature[]
}

export function VendorComparison({ vendors: initialVendors, features }: VendorComparisonProps) {
  const [vendors, setVendors] = useState(initialVendors)
  const [favoriteVendors, setFavoriteVendors] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Sort vendors
  const sortVendors = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })

    const sortedVendors = [...vendors].sort((a, b) => {
      if (key === "rating") {
        return direction === "asc" ? a.rating - b.rating : b.rating - a.rating
      }
      if (key === "name") {
        return direction === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      }
      return 0
    })
    setVendors(sortedVendors)
  }

  // Toggle favorite vendor
  const toggleFavorite = (vendorId: string) => {
    setFavoriteVendors((prev) => (prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]))
  }

  // Toggle feature filter
  const toggleFeatureFilter = (featureId: string) => {
    setActiveFilters((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId],
    )
  }

  // Filter vendors
  const filteredVendors = vendors.filter((vendor) => {
    // Search filter
    if (searchTerm && !vendor.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Feature filters
    if (activeFilters.length > 0) {
      return activeFilters.every((featureId) => !!vendor.features[featureId])
    }

    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="relative grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
              {activeFilters.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {features.map((feature) => (
              <DropdownMenuItem
                key={feature.id}
                className="flex items-center space-x-2"
                onSelect={(e) => {
                  e.preventDefault()
                  toggleFeatureFilter(feature.id)
                }}
              >
                <Checkbox id={`filter-${feature.id}`} checked={activeFilters.includes(feature.id)} />
                <label htmlFor={`filter-${feature.id}`} className="text-sm flex-1 cursor-pointer">
                  {feature.name}
                </label>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" onClick={() => sortVendors("rating")} className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Rating
          {sortConfig?.key === "rating" &&
            (sortConfig.direction === "asc" ? (
              <SortAsc className="h-3 w-3 ml-1" />
            ) : (
              <SortDesc className="h-3 w-3 ml-1" />
            ))}
        </Button>

        <Button variant="outline" onClick={() => sortVendors("name")} className="flex items-center gap-2">
          Name
          {sortConfig?.key === "name" &&
            (sortConfig.direction === "asc" ? (
              <SortAsc className="h-3 w-3 ml-1" />
            ) : (
              <SortDesc className="h-3 w-3 ml-1" />
            ))}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Vendor Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Vendor</TableHead>
                  {features.map((feature) => (
                    <TableHead key={feature.id}>{feature.name}</TableHead>
                  ))}
                  <TableHead>Price Range</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFavorite(vendor.id)}
                          className={`text-gray-400 hover:text-red-500 transition-colors ${
                            favoriteVendors.includes(vendor.id) ? "text-red-500" : ""
                          }`}
                        >
                          <Heart
                            className="h-4 w-4"
                            fill={favoriteVendors.includes(vendor.id) ? "currentColor" : "none"}
                          />
                        </button>
                        {vendor.name}
                      </div>
                    </TableCell>

                    {features.map((feature) => (
                      <TableCell key={feature.id}>
                        {typeof vendor.features[feature.id] === "boolean" ? (
                          vendor.features[feature.id] === true ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )
                        ) : (
                          <span>{vendor.features[feature.id]}</span>
                        )}
                      </TableCell>
                    ))}

                    <TableCell>{vendor.priceRange}</TableCell>
                    <TableCell>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < vendor.rating ? "text-amber-500 fill-amber-500" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Request Demo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {favoriteVendors.length > 0 && (
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">
                  {favoriteVendors.length} vendor{favoriteVendors.length !== 1 ? "s" : ""}
                </span>{" "}
                saved to shortlist
              </div>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Shortlist
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
