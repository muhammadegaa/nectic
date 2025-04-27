"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "@/components/app/app-sidebar"
import { MobileNavigation } from "@/components/mobile-navigation"
import { useMediaQuery } from "@/hooks/use-media-query"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export default function ClientAppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col">
        <LoadingSpinner size="lg" />
        <p className="mt-4">Authenticating...</p>
      </div>
    )
  }

  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleSidebarClose = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar for desktop */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full sticky top-0 transition-all duration-300 ease-in-out w-64"
        >
          <AppSidebar onNavigate={isMobile ? handleSidebarClose : undefined} />
        </motion.div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile navigation */}
        <MobileNavigation
          userName={user.displayName || "User"}
          userInitials={
            user.displayName
              ? user.displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : "U"
          }
          sidebarOpen={isSidebarOpen}
          onSidebarClose={handleSidebarClose}
          onMenuClick={handleMenuClick}
          notificationCount={3}
          showMenuButton={isMobile}
        />

        {/* Page content with smooth transition */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={cn(
            "flex-1 overflow-y-auto",
            isMobile ? "pb-16" : "pb-8", // Add bottom padding on mobile for better spacing
          )}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
