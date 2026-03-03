"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronRight, Home, User, LogOut, Settings, Menu, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AppNavigationProps {
  breadcrumbs?: BreadcrumbItem[]
}

export function AppNavigation({ breadcrumbs = [] }: AppNavigationProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
      router.push("/auth/login")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      })
    }
  }

  // Generate breadcrumbs from pathname if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (breadcrumbs.length > 0) return breadcrumbs

    const paths = pathname.split("/").filter(Boolean)
    const crumbs: BreadcrumbItem[] = [{ label: "Dashboard", href: "/dashboard" }]

    if (paths[0] === "agents") {
      if (paths[1] === "new") {
        crumbs.push({ label: "New Agent" })
      } else if (paths[1]) {
        crumbs.push({ label: "Agent", href: `/agents/${paths[1]}/chat` })
        if (paths[2] === "chat") {
          crumbs.push({ label: "Chat" })
        } else if (paths[2] === "edit") {
          crumbs.push({ label: "Edit" })
        } else if (paths[2] === "audit") {
          crumbs.push({ label: "Audit Logs" })
        }
      } else {
        crumbs.push({ label: "Agents" })
      }
    }

    return crumbs
  }

  const finalBreadcrumbs = generateBreadcrumbs()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo + Breadcrumbs */}
          <div className="flex items-center gap-5 min-w-0 flex-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group transition-opacity duration-200 hover:opacity-80 flex-shrink-0"
            >
              <img
                src="/logo-icon.svg"
                alt="Nectic"
                className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            {/* Breadcrumbs */}
            {finalBreadcrumbs.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-foreground/60 min-w-0">
                {finalBreadcrumbs.map((crumb, index) => {
                  const isLast = index === finalBreadcrumbs.length - 1
                  return (
                    <div key={index} className="flex items-center gap-2 min-w-0">
                      {index > 0 && (
                        <ChevronRight className="w-4 h-4 text-foreground/40 flex-shrink-0" />
                      )}
                      {crumb.href && !isLast ? (
                        <Link
                          href={crumb.href}
                          className="hover:text-foreground transition-colors truncate"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={isLast ? "text-foreground font-medium" : "truncate"}>
                          {crumb.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {user && (
              <>
                {/* Desktop User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-11 w-11 rounded-full hidden sm:flex p-0 hover:bg-muted/80 transition-colors"
                      aria-label="User menu"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted border-2 border-border hover:border-foreground/20 transition-colors">
                        <User className="h-5 w-5 text-foreground" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="px-3 py-3">
                      <div className="flex flex-col space-y-1.5">
                        <p className="text-sm font-semibold leading-tight">
                          {user.displayName || "User"}
                        </p>
                        <p className="text-xs leading-tight text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="px-3 py-2.5">
                      <Link href="/dashboard" className="cursor-pointer flex items-center">
                        <Home className="mr-3 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled className="px-3 py-2.5">
                      <Settings className="mr-3 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer px-3 py-2.5 text-destructive focus:text-destructive">
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="sm:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && user && (
          <div className="sm:hidden border-t border-border py-4 space-y-2">
            <div className="px-2 py-2">
              <p className="text-sm font-medium">{user.displayName || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <div className="border-t border-border pt-2 space-y-1">
              <Link
                href="/dashboard"
                className="block px-2 py-2 text-sm hover:bg-muted rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="inline-block mr-2 h-4 w-4" />
                Dashboard
              </Link>
              <button
                onClick={() => {
                  handleSignOut()
                  setMobileMenuOpen(false)
                }}
                className="w-full text-left px-2 py-2 text-sm hover:bg-muted rounded-md"
              >
                <LogOut className="inline-block mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

