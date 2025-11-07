import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "lucide-react"

interface VendorTestimonialProps {
  quote: string
  authorName: string
  authorTitle: string
  authorCompany: string
  authorAvatarUrl?: string
  metrics?: Array<{ label: string; value: string }>
}

export function VendorTestimonial({
  quote,
  authorName,
  authorTitle,
  authorCompany,
  authorAvatarUrl,
  metrics,
}: VendorTestimonialProps) {
  // Get initials from name
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <Quote className="h-6 w-6 text-muted-foreground mb-2" />
        <blockquote className="text-sm mb-4">"{quote}"</blockquote>

        <div className="flex items-center gap-3">
          <Avatar>
            {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} alt={authorName} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{authorName}</div>
            <div className="text-xs text-muted-foreground">
              {authorTitle}, {authorCompany}
            </div>
          </div>
        </div>

        {metrics && metrics.length > 0 && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium">{metric.value}</div>
                <div className="text-xs text-muted-foreground">{metric.label}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
