"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { VendorLogo } from "@/components/vendor-logo"
import { CheckCircle, Clock, Code, Database, FileText, Users } from "lucide-react"

interface ImplementationPhase {
  name: string
  duration: number
  description: string
  tasks: string[]
  resources: Array<{
    type: "it" | "business" | "training"
    level: "low" | "medium" | "high"
    description: string
  }>
}

interface VendorImplementation {
  id: string
  name: string
  logoUrl: string
  totalDuration: number
  phases: ImplementationPhase[]
  dataMigrationApproach: string
  technicalRequirements: string[]
  trainingDetails: {
    duration: number
    format: string
    materials: string[]
  }
}

interface VendorImplementationGuideProps {
  vendors: VendorImplementation[]
}

export function VendorImplementationGuide({ vendors }: VendorImplementationGuideProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string>(vendors[0]?.id || "")

  // Get selected vendor
  const selectedVendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0]

  // Resource level indicator
  const renderResourceLevel = (level: "low" | "medium" | "high") => {
    const levels = {
      low: { color: "bg-green-500", width: "w-1/3" },
      medium: { color: "bg-amber-500", width: "w-2/3" },
      high: { color: "bg-red-500", width: "w-full" },
    }

    return (
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${levels[level].color} ${levels[level].width}`}></div>
      </div>
    )
  }

  // Resource type icon
  const renderResourceIcon = (type: "it" | "business" | "training") => {
    if (type === "it") {
      return <Code className="h-4 w-4 text-blue-500" />
    } else if (type === "business") {
      return <Users className="h-4 w-4 text-amber-500" />
    } else {
      return <FileText className="h-4 w-4 text-green-500" />
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Vendor Implementation Guide</CardTitle>
        <CardDescription>Compare implementation approaches across vendors</CardDescription>
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
            <TabsContent key={vendor.id} value={vendor.id} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Total Implementation Time</h3>
                  <div className="text-2xl font-bold">{vendor.totalDuration} weeks</div>
                </div>
                <div className="text-right">
                  <h3 className="font-medium">Training Time</h3>
                  <div className="text-2xl font-bold">{vendor.trainingDetails.duration} days</div>
                </div>
              </div>

              {/* Implementation Timeline */}
              <div>
                <h3 className="font-medium mb-4">Implementation Timeline</h3>
                <div className="space-y-4">
                  {vendor.phases.map((phase, index) => {
                    // Calculate phase percentage of total duration
                    const phasePercentage = (phase.duration / vendor.totalDuration) * 100

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm">
                              {index + 1}
                            </div>
                            <span className="font-medium">{phase.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{phase.duration} weeks</span>
                          </div>
                        </div>
                        <Progress value={phasePercentage} className="h-2" />
                        <p className="text-sm text-muted-foreground">{phase.description}</p>

                        <div className="pl-8 space-y-1">
                          {phase.tasks.map((task, taskIndex) => (
                            <div key={taskIndex} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                              <span>{task}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Resource Requirements */}
              <div>
                <h3 className="font-medium mb-4">Resource Requirements</h3>
                <div className="space-y-3">
                  {vendor.phases.flatMap((phase) =>
                    phase.resources.map((resource, index) => (
                      <div
                        key={`${phase.name}-${index}`}
                        className="flex items-center justify-between bg-muted/30 p-3 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          {renderResourceIcon(resource.type)}
                          <div>
                            <div className="font-medium text-sm capitalize">{resource.type} Resources</div>
                            <div className="text-xs text-muted-foreground">{resource.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs capitalize">{resource.level}</span>
                          {renderResourceLevel(resource.level)}
                        </div>
                      </div>
                    )),
                  )}
                </div>
              </div>

              {/* Data Migration Approach */}
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800 mb-1">Data Migration Approach</h3>
                    <p className="text-sm text-blue-700">{vendor.dataMigrationApproach}</p>
                  </div>
                </div>
              </div>

              {/* Technical Requirements */}
              <div>
                <h3 className="font-medium mb-2">Technical Requirements</h3>
                <ul className="space-y-1">
                  {vendor.technicalRequirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Code className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Training Details */}
              <div>
                <h3 className="font-medium mb-2">Training Details</h3>
                <div className="bg-muted/30 p-4 rounded-md">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Format</div>
                      <div className="font-medium">{vendor.trainingDetails.format}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                      <div className="font-medium">{vendor.trainingDetails.duration} days</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground mb-2">Materials Provided</div>
                    <ul className="space-y-1">
                      {vendor.trainingDetails.materials.map((material, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <FileText className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>{material}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
