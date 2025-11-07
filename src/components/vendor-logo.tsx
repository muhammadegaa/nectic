import Image from "next/image"
import { cn } from "@/lib/utils"

interface VendorLogoProps {
  name: string
  logoUrl: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function VendorLogo({ name, logoUrl, size = "md", className }: VendorLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  return (
    <div
      className={cn(
        "relative bg-white rounded-md border overflow-hidden flex items-center justify-center",
        sizeClasses[size],
        className,
      )}
    >
      <Image src={logoUrl || "/placeholder.svg"} alt={`${name} logo`} fill className="object-contain p-1" />
    </div>
  )
}
