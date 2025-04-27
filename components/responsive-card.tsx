"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface ResponsiveCardProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
  footerClassName?: string
}

export function ResponsiveCard({
  title,
  description,
  children,
  footer,
  collapsible = false,
  defaultCollapsed = false,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
}: ResponsiveCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader
        className={cn("flex flex-row items-center justify-between", collapsible && "cursor-pointer", headerClassName)}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {collapsible && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        )}
      </CardHeader>

      <AnimatePresence>
        {(!collapsible || !isCollapsed) && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={collapsible ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.2 }}
          >
            <CardContent className={cn(contentClassName)}>{children}</CardContent>

            {footer && <CardFooter className={cn(footerClassName)}>{footer}</CardFooter>}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
