import Image from "next/image"
import { cn } from "@/lib/utils"

interface CustomerLogoProps {
  name: string
  logoUrl: string
  className?: string
}

export function CustomerLogo({ name, logoUrl, className }: CustomerLogoProps) {
  return (
    <div
      className={cn(
        "relative w-16 h-8 bg-white rounded-sm border overflow-hidden flex items-center justify-center grayscale hover:grayscale-0 transition-all",
        className,
      )}
    >
      <Image src={logoUrl || "/placeholder.svg"} alt={`${name} logo`} fill className="object-contain p-1" />
      <span className="sr-only">{name}</span>
    </div>
  )
}
