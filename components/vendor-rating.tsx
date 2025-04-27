import { Star, Users, Trophy } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface VendorRatingProps {
  g2Rating: number
  g2ReviewCount: number
  customersLikeYou: number
  marketLeader?: boolean
}

export function VendorRating({ g2Rating, g2ReviewCount, customersLikeYou, marketLeader }: VendorRatingProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
              <Star className="h-4 w-4 fill-blue-500 text-blue-500" />
              <span className="font-medium">{g2Rating.toFixed(1)}</span>
              <span className="text-blue-500 text-xs">({g2ReviewCount})</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>G2 Rating based on {g2ReviewCount} verified reviews</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-2 py-1 rounded-md">
              <Users className="h-4 w-4 text-green-600" />
              <span className="font-medium">{customersLikeYou}</span>
              <span className="text-green-600 text-xs">similar</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{customersLikeYou} financial services companies similar to yours use this vendor</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {marketLeader && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-sm bg-amber-50 text-amber-700 px-2 py-1 rounded-md">
                <Trophy className="h-4 w-4 text-amber-600" />
                <span className="font-medium">Leader</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Market leader in financial services document processing</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
