"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { VendorLogo } from "@/components/vendor-logo"
import { Download, Share2 } from "lucide-react"

interface VendorROI {
  id: string
  name: string
  logoUrl: string
  implementationTimeWeeks: number
  implementationCostMultiplier: number
  maintenanceCostPercentage: number
  efficiencyGainPercentage: number
}

interface VendorROICalculatorProps {
  vendors: VendorROI[]
  initialMonthlySavings: number
  initialImplementationCost: number
}

export function VendorROICalculator({
  vendors,
  initialMonthlySavings,
  initialImplementationCost,
}: VendorROICalculatorProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string>(vendors[0]?.id || "")
  const [monthlySavings, setMonthlySavings] = useState(initialMonthlySavings)
  const [includeTraining, setIncludeTraining] = useState(true)
  const [includeMaintenance, setIncludeMaintenance] = useState(true)

  // Get selected vendor
  const selectedVendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0]

  // Calculate ROI metrics for selected vendor
  const annualSavings = monthlySavings * 12 * (1 + selectedVendor.efficiencyGainPercentage / 100)
  const implementationCost = initialImplementationCost * selectedVendor.implementationCostMultiplier
  const trainingCost = includeTraining ? initialImplementationCost * 0.15 : 0
  const maintenanceCost = includeMaintenance ? implementationCost * (selectedVendor.maintenanceCostPercentage / 100) : 0
  const totalFirstYearCost = implementationCost + trainingCost + maintenanceCost
  const roi = Math.round((annualSavings / totalFirstYearCost) * 100)
  const paybackMonths = Math.round(totalFirstYearCost / (annualSavings / 12))
  const threeYearSavings = annualSavings * 3 - totalFirstYearCost - maintenanceCost * 2

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Handle download report
  const handleDownloadReport = () => {
    // In a real implementation, this would generate a PDF or Excel report
    alert(`Downloading ROI report for ${selectedVendor.name}...`)
  }

  // Handle share report
  const handleShareReport = () => {
    // In a real implementation, this would open a share dialog
    alert(`Sharing ROI report for ${selectedVendor.name}...`)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Vendor-Specific ROI Calculator</CardTitle>
        <CardDescription>Compare ROI across different vendors</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue={selectedVendorId} onValueChange={setSelectedVendorId}>
          <TabsList className="grid grid-cols-3 mb-4">
            {vendors.map((vendor) => (
              <TabsTrigger key={vendor.id} value={vendor.id} className="flex items-center gap-2">
                <VendorLogo name={vendor.name} logoUrl={vendor.logoUrl} size="sm" />
                <span>{vendor.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {vendors.map((vendor) => (
            <TabsContent key={vendor.id} value={vendor.id} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Implementation Time</div>
                  <div className="text-2xl font-bold">{vendor.implementationTimeWeeks} weeks</div>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Maintenance</div>
                  <div className="text-2xl font-bold">{vendor.maintenanceCostPercentage}% yearly</div>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Efficiency Gain</div>
                  <div className="text-2xl font-bold text-green-600">+{vendor.efficiencyGainPercentage}%</div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Monthly Savings Estimate</Label>
              <span className="text-sm font-medium">{formatCurrency(monthlySavings)}</span>
            </div>
            <Slider
              defaultValue={[monthlySavings]}
              max={initialMonthlySavings * 2}
              min={initialMonthlySavings * 0.5}
              step={100}
              onValueChange={(val) => setMonthlySavings(val[0])}
              className="py-4"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Switch id="training" checked={includeTraining} onCheckedChange={setIncludeTraining} />
              <Label htmlFor="training">Include Training Costs</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="maintenance" checked={includeMaintenance} onCheckedChange={setIncludeMaintenance} />
              <Label htmlFor="maintenance">Include Maintenance Costs</Label>
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-medium mb-4">ROI Summary for {selectedVendor.name}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Total First Year Cost:</p>
              <p className="text-2xl font-bold">{formatCurrency(totalFirstYearCost)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Annual Savings:</p>
              <p className="text-2xl font-bold">{formatCurrency(annualSavings)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Return on Investment:</p>
              <p className="text-2xl font-bold text-green-600">{roi}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payback Period:</p>
              <p className="text-2xl font-bold">{paybackMonths} months</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground">3-Year Net Savings:</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(threeYearSavings)}</p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2">Vendor-Specific Advantages</h3>
          <ul className="space-y-2 text-sm text-blue-700">
            {selectedVendor.id === "docusense" && (
              <>
                <li>• Faster implementation timeline reduces time-to-value</li>
                <li>• Higher efficiency gains due to advanced AI capabilities</li>
                <li>• Lower maintenance costs over time</li>
              </>
            )}
            {selectedVendor.id === "formcraft" && (
              <>
                <li>• Lower upfront implementation costs</li>
                <li>• Simplified integration reduces IT resource requirements</li>
                <li>• Standardized templates accelerate deployment</li>
              </>
            )}
            {selectedVendor.id === "intelligentdocs" && (
              <>
                <li>• Specialized financial services document processing</li>
                <li>• Compliance-focused features reduce regulatory risk</li>
                <li>• Advanced analytics provide deeper business insights</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleDownloadReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download ROI Report
        </Button>
        <Button variant="outline" onClick={handleShareReport} className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share Report
        </Button>
      </CardFooter>
    </Card>
  )
}
