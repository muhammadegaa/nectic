"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function RedirectToImplementationProject() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id

  useEffect(() => {
    // Redirect to the new path
    router.replace(`/dashboard/implementation/${projectId}`)
  }, [router, projectId])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-500">Redirecting to project details...</p>
    </div>
  )
}
