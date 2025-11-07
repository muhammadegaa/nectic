"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Mail, MessageSquare } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"

interface ShareButtonProps {
  title: string
  text: string
  url?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function ShareButton({ title, text, url, variant = "outline", size = "default", className }: ShareButtonProps) {
  const [isSupported, setIsSupported] = useState(() => {
    return typeof navigator !== "undefined" && !!navigator.share
  })

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "")

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        })
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error)
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link copied",
      description: "The link has been copied to your clipboard.",
    })
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(title)
    const body = encodeURIComponent(`${text}\n\n${shareUrl}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const shareViaSMS = () => {
    const body = encodeURIComponent(`${title}\n${shareUrl}`)
    window.open(`sms:?body=${body}`)
  }

  return isSupported ? (
    <Button variant={variant} size={size} className={className} onClick={handleShare}>
      <Share2 className="h-4 w-4 mr-2" />
      Share
    </Button>
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyToClipboard}>
          <Copy className="h-4 w-4 mr-2" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareViaEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareViaSMS}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Message
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
