"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Search, Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { AppSidebar } from "@/components/app/app-sidebar"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"

interface MobileNavigationProps {
  userName?: string
  userInitials?: string
  notificationCount?: number
  onMenuClick?: () => void
  sidebarOpen?: boolean
  onSidebarClose?: () => void
  showMenuButton?: boolean
}

export function MobileNavigation({
  userName = "John Doe",
  userInitials = "JD",
  notificationCount = 0,
  onMenuClick,
  sidebarOpen = false,
  onSidebarClose,
  showMenuButton = true,
}: MobileNavigationProps) {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Track if user has scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle menu button click
  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen)
    if (onMenuClick) {
      onMenuClick()
    }
  }

  // Handle sidebar close
  const handleSidebarClose = () => {
    setIsSidebarOpen(false)
    if (onSidebarClose) {
      onSidebarClose()
    }
  }

  return (
    <>
      {/* Fixed top navigation */}
      <motion.header
        initial={{ y: 0 }}
        animate={{
          y: 0,
          backgroundColor: isScrolled ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.95)",
          boxShadow: isScrolled ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
        }}
        transition={{ duration: 0.2 }}
        className="fixed top-0 left-0 right-0 z-40 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left side with menu and logo */}
          <div className="flex items-center">
            {showMenuButton && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 text-amber-600 hover:bg-amber-50"
                onClick={handleMenuClick}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            )}

            <Link href="/dashboard" className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-sm font-medium text-amber-600">N</span>
              </div>
              <span className="ml-2 font-bold text-xl text-amber-600">Nectic</span>
            </Link>
          </div>

          {/* Right side with actions */}
          <div className="flex items-center gap-2">
            {/* Search drawer */}
            <Drawer open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-gray-600 hover:bg-amber-50">
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[40%] p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Search</h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input placeholder="Search opportunities, projects..." className="pl-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Recent Searches</h4>
                    <div className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start text-left">
                        Customer service chatbot
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-left">
                        Document processing automation
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-left">
                        Sales forecasting
                      </Button>
                    </div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>

            {/* Notifications button */}
            <Button variant="ghost" size="icon" className="relative text-gray-600 hover:bg-amber-50">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-amber-500 hover:bg-amber-600">
                  {notificationCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>

            {/* Profile button */}
            <Button variant="ghost" size="icon" asChild className="hover:bg-amber-50">
              <Link href="/dashboard/profile">
                <Avatar className="h-8 w-8 border-2 border-amber-100">
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Profile</span>
              </Link>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Spacer to prevent content from being hidden under the fixed header */}
      <div className="h-14"></div>

      {/* Mobile sidebar with enhanced animations */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[280px] border-r border-amber-100 shadow-xl">
          <AppSidebar onNavigate={handleSidebarClose} />
        </SheetContent>
      </Sheet>
    </>
  )
}
