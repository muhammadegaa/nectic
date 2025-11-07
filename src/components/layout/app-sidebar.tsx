"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Lightbulb, Settings, Users, CheckCircle2, FileText, LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Separator } from "@/components/ui/separator"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Opportunities", href: "/dashboard/opportunities", icon: Lightbulb },
  { name: "Implementation", href: "/dashboard/implementation", icon: FileText },
  { name: "Analytics", href: "/dashboard/analytics", icon: CheckCircle2 },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface AppSidebarProps {
  onNavigate?: () => void
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const userInitials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-amber-50/30 border-r w-full">
      {/* Logo area */}
      <div className="flex items-center justify-center h-16 border-b bg-white/80 backdrop-blur-sm">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-sm font-medium text-amber-600">N</span>
          </div>
          <span className="font-bold text-xl text-amber-600">Nectic</span>
        </Link>
      </div>

      {/* Navigation menu */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="grid gap-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/dashboard")
            return (
              <Link key={item.name} href={item.href} onClick={onNavigate}>
                <Button
                  variant="ghost"
                  className={cn(
                    "justify-start w-full font-medium transition-all duration-200 rounded-lg h-11",
                    isActive
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800"
                      : "text-gray-600 hover:bg-amber-50 hover:text-amber-600",
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 transition-transform duration-200",
                      isActive ? "text-amber-600" : "text-gray-400",
                    )}
                  />
                  {item.name}

                  {isActive && <div className="absolute left-0 h-full w-1 bg-amber-500 rounded-r-full" />}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom actions */}
      <div className="p-4 mt-auto">
        <Separator className="mb-4 bg-amber-100/50" />
        <Button
          variant="outline"
          className="w-full justify-start border-amber-200 text-amber-700 hover:bg-amber-50"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
