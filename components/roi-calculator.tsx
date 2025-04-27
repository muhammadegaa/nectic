"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Download, Share2 } from "lucide-react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface ROICalculatorProps {
  initialMonthlySavings: number
  initialImplementationCost: number
  initialTimeWeeks: number
}

export function ROICalculator({
  initialMonthlySavings,
  initialImplementationCost,
  initialTimeWeeks,
}: ROICalculatorProps) {
  // State for adjustable values
  const [implementationScope, setImplementationScope] = useState<"basic" | "standard" | "comprehensive">("standard")
  const [monthlySavings, setMonthlySavings] = useState(initialMonthlySavings)
  const [implementationCost, setImplementationCost] = useState(initialImplementationCost)
  const [timelineWeeks, setTimelineWeeks] = useState(initialTimeWeeks)
  const [includeTraining, setIncludeTraining] = useState(true)
  const [includeMaintenance, setIncludeMaintenance] = useState(true)

  // Calculate ROI metrics
  const annualSavings = monthlySavings * 12
  const totalFirstYearCost = calculateTotalCost()
  const roi = Math.round((annualSavings / totalFirstYearCost) * 100)
  const paybackMonths = Math.round(totalFirstYearCost / monthlySavings)
  const threeYearSavings = monthlySavings * 36 - totalFirstYearCost

  function calculateTotalCost() {
    let cost = implementationCost

    // Adjust cost based on scope
    if (implementationScope === "basic") {
      cost = implementationCost * 0.7
    } else if (implementationScope === "comprehensive") {
      cost = implementationCost * 1.3
    }

    // Add training costs if selected
    if (includeTraining) {
      cost += initialImplementationCost * 0.15
    }

    // Add maintenance costs if selected
    if (includeMaintenance) {
      cost += initialImplementationCost * 0.2
    }

    return cost
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleDownloadReport = () => {
    // In a real implementation, this would generate a PDF or Excel report
    alert("Downloading ROI report...")
  }

  const handleShareReport = () => {
    // In a real implementation, this would open a share dialog
    alert("Sharing ROI report...")
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Interactive ROI Calculator</CardTitle>
        <CardDescription>Adjust parameters to see how they affect your ROI</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Implementation Scope</Label>
              <span className="text-sm font-medium capitalize">{implementationScope}</span>
            </div>
            <Select
              value={implementationScope}
              onValueChange={(val: "basic" | "standard" | "comprehensive") => setImplementationScope(val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="basic">Basic Implementation</SelectItem>
                  <SelectItem value="standard">Standard Implementation</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive Implementation</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

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

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Implementation Timeline</Label>
              <span className="text-sm font-medium">{timelineWeeks} weeks</span>
            </div>
            <Slider
              defaultValue={[timelineWeeks]}
              max={initialTimeWeeks * 1.5}
              min={Math.max(4, initialTimeWeeks * 0.75)}
              step={1}
              onValueChange={(val) => setTimelineWeeks(val[0])}
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
          <h3 className="font-medium mb-4">ROI Summary</h3>
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
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleDownloadReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
        <Button variant="outline" onClick={handleShareReport} className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share Report
        </Button>
      </CardFooter>
    </Card>
  )
}
