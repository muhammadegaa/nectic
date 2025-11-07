import type React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  padding?: "none" | "sm" | "md" | "lg"
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = "xl",
  padding = "md",
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  }

  const paddingClasses = {
    none: "px-0",
    sm: "px-3",
    md: "px-4 sm:px-6",
    lg: "px-4 sm:px-6 md:px-8",
  }

  return (
    <div className={cn("w-full mx-auto", maxWidthClasses[maxWidth], paddingClasses[padding], className)}>
      {children}
    </div>
  )
}
