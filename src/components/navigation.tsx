"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-200 ${
        scrolled ? "bg-background/80 backdrop-blur-sm border-b border-border/50" : "bg-background/0"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Nectic" className="w-8 h-8" />
            <span className="text-xl font-medium text-foreground tracking-tight">Nectic</span>
          </Link>

          {/* Desktop Menu - Minimal */}
          <div className="hidden lg:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              Product
            </a>
            <a
              href="#security"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              Security
            </a>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-foreground/60 hover:text-foreground"
            >
              Talk to us
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden pb-6 space-y-4 border-t border-border/50 pt-4">
            <a
              href="#features"
              onClick={() => setIsOpen(false)}
              className="block text-sm text-foreground/60 hover:text-foreground"
            >
              Product
            </a>
            <a
              href="#security"
              onClick={() => setIsOpen(false)}
              className="block text-sm text-foreground/60 hover:text-foreground"
            >
              Security
            </a>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              Talk to us
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
