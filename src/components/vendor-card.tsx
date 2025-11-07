"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VendorLogo } from "@/components/vendor-logo"
import { VendorRating } from "@/components/vendor-rating"
import { CustomerLogo } from "@/components/customer-logo"
import { Calendar, Download, ExternalLink } from "lucide-react"

interface VendorCardProps {
  id: string
  name: string
  description: string
  logoUrl: string
  g2Rating: number
  g2ReviewCount: number
  customersLikeYou: number
  marketLeader?: boolean
  specialties: string[]
  trustedBy: Array<{ name: string; logoUrl: string }>
  freeTrialAvailable: boolean
  onScheduleDemo: (vendorId: string) => void
  onDownloadBrief: (vendorId: string) => void
  onStartFreeTrial?: (vendorId: string) => void
}

export function VendorCard({
  id,
  name,
  description,
  logoUrl,
  g2Rating,
  g2ReviewCount,
  customersLikeYou,
  marketLeader,
  specialties,
  trustedBy,
  freeTrialAvailable,
  onScheduleDemo,
  onDownloadBrief,
  onStartFreeTrial,
}: VendorCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <VendorLogo name={name} logoUrl={logoUrl} size="lg" />
          <VendorRating
            g2Rating={g2Rating}
            g2ReviewCount={g2ReviewCount}
            customersLikeYou={customersLikeYou}
            marketLeader={marketLeader}
          />
        </div>
        <CardTitle className="mt-2">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Specialties</h4>
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Trusted By</h4>
            <div className="flex flex-wrap gap-2">
              {trustedBy.map((company, index) => (
                <CustomerLogo key={index} name={company.name} logoUrl={company.logoUrl} />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button className="w-full" onClick={() => onScheduleDemo(id)}>
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Demo
        </Button>
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={() => onDownloadBrief(id)}>
            <Download className="mr-2 h-4 w-4" />
            Download Brief
          </Button>
          {freeTrialAvailable && onStartFreeTrial && (
            <Button variant="outline" className="flex-1" onClick={() => onStartFreeTrial(id)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Free Trial
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
