"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function RedirectToDashboard() {
  const router = useRouter()
  const params = useParams()
  const path = params.path || []
  const pathString = Array.isArray(path) ? path.join("/") : path

  useEffect(() => {
    // Redirect to the corresponding dashboard path
    router.replace(`/dashboard${pathString ? `/${pathString}` : ""}`)
  }, [router, pathString])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-500">Redirecting to dashboard...</p>
    </div>
  )
}
