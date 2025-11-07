import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function AssessmentLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 flex flex-col">
      <header className="w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="container flex h-16 items-center">
          <Skeleton className="h-8 w-32" />
        </div>
      </header>

      <div className="container max-w-4xl mx-auto py-12 px-4 flex-1">
        <Skeleton className="h-6 w-32 mb-6" />

        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-full max-w-lg" />
        </div>

        <div className="mb-8">
          <Skeleton className="h-8 w-full max-w-md mx-auto" />
        </div>

        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full mt-4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Skeleton className="h-6 w-full max-w-md mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
