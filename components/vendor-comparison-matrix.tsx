"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface VendorFeature {
  id: string
  name: string
}

interface Vendor {
  id: string
  name: string
  features: Record<string, boolean | string>
}

interface VendorComparisonProps {
  vendors: Vendor[]
  features: VendorFeature[]
}

export function VendorComparisonMatrix({ vendors, features }: VendorComparisonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Comparison Matrix</CardTitle>
        <CardDescription>Compare features across different vendors</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Implementation pending...</p>
      </CardContent>
    </Card>
  )
}
